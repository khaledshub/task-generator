import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  toAiFailureMessage,
  toAiGeneratingMessage,
  toAiInProgressMessage,
  toAiRequestKey,
  toPolledAiState,
  toAiSourceLabel,
  type AiGenerationRequest,
  type AiStatusContext,
} from "@/components/tasks/ai-status";
import {
  getTaskAiStatus,
  startAiStarterStep,
} from "@/lib/tasks/client-api";
import { isAiTerminalStatus, type AiStepsGenerationStatus } from "@/lib/tasks/ai-lifecycle";
import type {
  TaskCreationLifecycleState,
  TaskFormState,
} from "@/lib/tasks/types";

const DEFAULT_POLL_INTERVAL_MS = 1800;

type AiLocalState = {
  runId: number;
  taskId?: string;
  request?: AiGenerationRequest;
  requestKey: string | null;
  aiStatus?: TaskFormState["aiStatus"];
  aiMessage?: string;
  generatedTips?: string[];
  lifecycle: Exclude<TaskCreationLifecycleState, "created">;
};

type AiLocalAction =
  | { type: "reset" }
  | {
      type: "start";
      runId: number;
      taskId: string;
      request: AiGenerationRequest;
      requestKey: string;
    }
  | {
      type: "pending";
      runId: number;
      message: string;
    }
  | {
      type: "ready";
      runId: number;
      request: AiGenerationRequest;
      tips?: string[];
    }
  | {
      type: "error";
      runId: number;
      message: string;
    }
  | {
      type: "poll_terminal";
      runId: number;
      aiStatus: TaskFormState["aiStatus"];
      aiMessage: string | undefined;
      lifecycle: "ai_success" | "ai_error" | "idle";
    };

export const INITIAL_AI_LOCAL_STATE: AiLocalState = {
  runId: 0,
  requestKey: null,
  lifecycle: "idle",
};

export function aiOrchestrationReducer(
  state: AiLocalState,
  action: AiLocalAction,
): AiLocalState {
  if (action.type === "reset") {
    return INITIAL_AI_LOCAL_STATE;
  }

  if (action.type === "start") {
    return {
      runId: action.runId,
      requestKey: action.requestKey,
      request: action.request,
      taskId: action.taskId,
      aiStatus: "info",
      aiMessage: toAiGeneratingMessage(action.request),
      lifecycle: "ai_pending",
    };
  }

  if (action.runId !== state.runId) {
    return state;
  }

  if (action.type === "pending") {
    return {
      ...state,
      aiStatus: "info",
      aiMessage: action.message,
      lifecycle: "ai_pending",
    };
  }

  if (action.type === "ready") {
    return {
      ...state,
      aiStatus: "success",
      aiMessage:
        `AI response ready. Tips were generated with ${toAiSourceLabel(action.request)} and applied.`,
      generatedTips: action.tips,
      lifecycle: "ai_success",
    };
  }

  if (action.type === "error") {
    return {
      ...state,
      aiStatus: "error",
      aiMessage: action.message,
      lifecycle: "ai_error",
    };
  }

  return {
    ...state,
    aiStatus: action.aiStatus,
    aiMessage: action.aiMessage,
    lifecycle: action.lifecycle,
  };
}

interface UseTaskAiOrchestrationOptions {
  baseState: TaskFormState;
  context: AiStatusContext;
  enabled?: boolean;
  pollIntervalMs?: number;
}

interface UseTaskAiOrchestrationResult {
  enhancedState: TaskFormState;
  lifecycle: TaskCreationLifecycleState;
  isAiBusy: boolean;
  generatedTips?: string[];
  retry: () => void;
}

/**
 * Shared client-side AI orchestration for task create/edit flows.
 */
export function useTaskAiOrchestration({
  baseState,
  context,
  enabled = true,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseTaskAiOrchestrationOptions): UseTaskAiOrchestrationResult {
  const [state, dispatch] = useReducer(aiOrchestrationReducer, INITIAL_AI_LOCAL_STATE);
  const [retryNonce, setRetryNonce] = useState(0);

  const activeRunIdRef = useRef(0);
  const lastTriggeredRef = useRef<{ requestKey: string | null; retryNonce: number }>({
    requestKey: null,
    retryNonce: -1,
  });
  const startControllerRef = useRef<AbortController | null>(null);
  const pollControllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abortInFlight = useCallback(() => {
    startControllerRef.current?.abort();
    pollControllerRef.current?.abort();
    startControllerRef.current = null;
    pollControllerRef.current = null;

    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    if (!state.request) {
      return;
    }

    setRetryNonce((value) => value + 1);
  }, [state.request]);

  useEffect(() => {
    return () => {
      abortInFlight();
    };
  }, [abortInFlight]);

  useEffect(() => {
    if (!enabled) {
      abortInFlight();
      dispatch({ type: "reset" });
      lastTriggeredRef.current = { requestKey: null, retryNonce: -1 };
      return;
    }

    if (baseState.statusState !== "success") {
      abortInFlight();
      dispatch({ type: "reset" });
      lastTriggeredRef.current = { requestKey: null, retryNonce: -1 };
      return;
    }

    const request = baseState.aiGenerationRequest;
    const taskId = request?.taskId ?? baseState.createdTaskId;

    if (!request || !taskId) {
      abortInFlight();
      dispatch({ type: "reset" });
      return;
    }

    const requestKey = toAiRequestKey(request);
    if (!requestKey) {
      return;
    }

    if (
      lastTriggeredRef.current.requestKey === requestKey &&
      lastTriggeredRef.current.retryNonce === retryNonce
    ) {
      return;
    }

    lastTriggeredRef.current = { requestKey, retryNonce };
    abortInFlight();

    const nextRunId = activeRunIdRef.current + 1;
    activeRunIdRef.current = nextRunId;

    dispatch({
      type: "start",
      runId: nextRunId,
      taskId,
      request,
      requestKey,
    });

    startControllerRef.current = new AbortController();

    const pollUntilTerminal = async (runId: number): Promise<void> => {
      pollControllerRef.current = new AbortController();

      const result = await getTaskAiStatus(taskId, pollControllerRef.current.signal);
      if (runId !== activeRunIdRef.current) {
        return;
      }

      if (!result.ok && (result.status === 401 || result.status === 404)) {
        dispatch({
          type: "error",
          runId,
          message: result.data.error ?? "Could not confirm AI task generation status.",
        });
        return;
      }

      if (result.ok && result.data.aiStepsGenerationStatus) {
        const status = result.data.aiStepsGenerationStatus;
        if (isAiTerminalStatus(status)) {
          const nextAiState = toPolledAiState(status, context, {
            aiStatus: "info",
            aiMessage: toAiInProgressMessage(request),
          });

          const lifecycle = toLifecycleFromTerminal(status);
          dispatch({
            type: "poll_terminal",
            runId,
            aiStatus: nextAiState.aiStatus,
            aiMessage: nextAiState.aiMessage,
            lifecycle,
          });
          return;
        }
      }

      pollTimerRef.current = setTimeout(() => {
        void pollUntilTerminal(runId);
      }, pollIntervalMs);
    };

    void (async () => {
      try {
        const startResult = await startAiStarterStep(
          request,
          startControllerRef.current?.signal,
        );

        if (nextRunId !== activeRunIdRef.current) {
          return;
        }

        if (!startResult.ok) {
          dispatch({
            type: "error",
            runId: nextRunId,
            message: startResult.data.error ?? toAiFailureMessage(context),
          });
          return;
        }

        if (
          startResult.data.result === "ready" ||
          startResult.data.aiStepsGenerationStatus === "READY"
        ) {
          dispatch({
            type: "ready",
            runId: nextRunId,
            request,
            tips: startResult.data.tips,
          });
          return;
        }

        dispatch({
          type: "pending",
          runId: nextRunId,
          message: toAiInProgressMessage(request, startResult.data.message),
        });

        void pollUntilTerminal(nextRunId);
      } catch (error) {
        if (nextRunId !== activeRunIdRef.current || isAbortError(error)) {
          return;
        }

        dispatch({
          type: "error",
          runId: nextRunId,
          message:
            error instanceof Error && error.message.trim().length > 0
              ? `${toAiFailureMessage(context)} ${error.message}`
              : toAiFailureMessage(context),
        });
      }
    })();
  }, [
    abortInFlight,
    baseState.aiGenerationRequest,
    baseState.createdTaskId,
    baseState.statusState,
    context,
    enabled,
    pollIntervalMs,
    retryNonce,
  ]);

  const lifecycle: TaskCreationLifecycleState = useMemo(() => {
    if (!enabled) {
      return "idle";
    }

    if (baseState.statusState !== "success") {
      return "idle";
    }

    if (!baseState.aiGenerationRequest) {
      return "created";
    }

    return state.lifecycle;
  }, [baseState.aiGenerationRequest, baseState.statusState, enabled, state.lifecycle]);

  const enhancedState = useMemo<TaskFormState>(() => {
    if (!enabled || lifecycle === "idle" || lifecycle === "created") {
      return baseState;
    }

    return {
      ...baseState,
      aiStatus: state.aiStatus,
      aiMessage: state.aiMessage,
    };
  }, [baseState, enabled, lifecycle, state.aiMessage, state.aiStatus]);

  return {
    enhancedState,
    lifecycle,
    isAiBusy: lifecycle === "ai_pending",
    generatedTips: state.generatedTips,
    retry,
  };
}

function toLifecycleFromTerminal(
  status: AiStepsGenerationStatus,
): "ai_success" | "ai_error" | "idle" {
  if (status === "READY") {
    return "ai_success";
  }

  if (status === "FAILED") {
    return "ai_error";
  }

  return "idle";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
