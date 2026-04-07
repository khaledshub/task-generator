import { TASK_AI_PROVIDER_LABELS } from "@/lib/tasks/config";
import {
  getAiFailureMessage,
  getAiReadyMessage,
  type AiStatusContext,
  type AiStepsGenerationStatus,
} from "@/lib/tasks/ai-lifecycle";
import type { TaskFormState } from "@/lib/tasks/types";

export type AiGenerationRequest = NonNullable<TaskFormState["aiGenerationRequest"]>;
export type { AiStatusContext };

export function toAiRequestKey(request?: TaskFormState["aiGenerationRequest"]): string | null {
  if (!request) {
    return null;
  }

  return `${request.taskId}:${request.aiProvider}:${request.localModel ?? ""}`;
}

export function toAiSourceLabel(request: AiGenerationRequest): string {
  return request.aiProvider === "LOCAL" && request.localModel
    ? `${TASK_AI_PROVIDER_LABELS[request.aiProvider]} (${request.localModel})`
    : TASK_AI_PROVIDER_LABELS[request.aiProvider];
}

export function toAiGeneratingMessage(request: AiGenerationRequest): string {
  return `Generating AI tips with ${toAiSourceLabel(request)}...`;
}

export function toAiInProgressMessage(
  request: AiGenerationRequest,
  message?: string,
): string {
  return message ?? `AI generation is still in progress (${toAiSourceLabel(request)}).`;
}

export function toAiFailureMessage(context: AiStatusContext): string {
  return getAiFailureMessage(context);
}

export function toPolledAiState(
  status: AiStepsGenerationStatus,
  context: AiStatusContext,
  currentState?: Pick<TaskFormState, "aiStatus" | "aiMessage">,
): Pick<TaskFormState, "aiStatus" | "aiMessage"> {
  if (status === "READY") {
    return {
      aiStatus: "success",
      aiMessage: getAiReadyMessage(),
    };
  }

  if (status === "FAILED") {
    return {
      aiStatus: "error",
      aiMessage: toAiFailureMessage(context),
    };
  }

  if (status === "SKIPPED") {
    return {
      aiStatus: undefined,
      aiMessage: undefined,
    };
  }

  return {
    aiStatus: currentState?.aiStatus ?? "info",
    aiMessage: currentState?.aiMessage,
  };
}
