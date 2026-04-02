import { TASK_AI_PROVIDER_LABELS } from "@/lib/tasks/config";
import type { TaskFormState } from "@/lib/tasks/types";

type AiTerminalStatus = "PENDING" | "READY" | "FAILED" | "SKIPPED";
export type AiStatusContext = "create" | "edit";

export type AiGenerationRequest = NonNullable<TaskFormState["aiGenerationRequest"]>;

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
  return context === "create"
    ? "Task created, but AI generation failed. You can still open the task and continue without AI tips."
    : "Task updated, but AI generation failed. You can still open the task and continue without AI tips.";
}

export function toPolledAiState(
  status: AiTerminalStatus,
  context: AiStatusContext,
  currentState?: Pick<TaskFormState, "aiStatus" | "aiMessage">,
): Pick<TaskFormState, "aiStatus" | "aiMessage"> {
  if (status === "READY") {
    return {
      aiStatus: "success",
      aiMessage: "AI tips are ready and available on the task details page.",
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
