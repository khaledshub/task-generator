const STALE_AI_PENDING_THRESHOLD_MS = 3 * 60 * 1000;
const AI_READY_MESSAGE = "AI tips are ready and available on the task details page.";
const AI_PENDING_DUPLICATE_MESSAGE = "AI generation is already in progress for this task.";
const AI_PENDING_STALE_MESSAGE =
  "AI checklist generation appears stuck. You can continue with the task now and retry AI generation later.";

export type AiStepsGenerationStatus = "PENDING" | "READY" | "FAILED" | "SKIPPED";
export type AiStatusContext = "create" | "edit";

export interface AiUpdateBehavior {
  nextStatus: AiStepsGenerationStatus;
  shouldTriggerGeneration: boolean;
}

export interface TaskAiStatusSnapshot {
  aiStepsGenerationStatus: AiStepsGenerationStatus;
  isPending: boolean;
  isTerminal: boolean;
  isStalePending: boolean;
  message?: string;
}

export function resolveInitialAiStatus(
  generateAiStepsEnabled: boolean,
): AiStepsGenerationStatus {
  return generateAiStepsEnabled ? "PENDING" : "SKIPPED";
}

export function resolveUpdateAiBehavior(
  existingTask: {
    generateAiStepsEnabled?: boolean;
    aiProvider?: "OPENAI" | "LOCAL";
    aiStepsGenerationStatus?: AiStepsGenerationStatus;
  },
  input: {
    generateAiStepsEnabled: boolean;
    aiProvider: "OPENAI" | "LOCAL";
  },
): AiUpdateBehavior {
  if (!input.generateAiStepsEnabled) {
    return {
      nextStatus: "SKIPPED",
      shouldTriggerGeneration: false,
    };
  }

  const currentStatus = existingTask.aiStepsGenerationStatus ?? "SKIPPED";
  const currentProvider = existingTask.aiProvider ?? "LOCAL";
  const wasAiEnabled = existingTask.generateAiStepsEnabled === true;
  const shouldTriggerGeneration =
    !wasAiEnabled ||
    currentProvider !== input.aiProvider ||
    currentStatus === "FAILED" ||
    currentStatus === "SKIPPED";

  return {
    nextStatus: shouldTriggerGeneration ? "PENDING" : currentStatus,
    shouldTriggerGeneration,
  };
}

export function isAiPendingStale(
  status: AiStepsGenerationStatus,
  updatedAt: Date,
  now: Date = new Date(),
): boolean {
  if (status !== "PENDING") {
    return false;
  }

  return now.getTime() - updatedAt.getTime() >= STALE_AI_PENDING_THRESHOLD_MS;
}

export function isAiTerminalStatus(status: AiStepsGenerationStatus): boolean {
  return status !== "PENDING";
}

export function getAiPendingStaleMessage(): string {
  return AI_PENDING_STALE_MESSAGE;
}

export function getAiPendingDuplicateMessage(): string {
  return AI_PENDING_DUPLICATE_MESSAGE;
}

export function getAiReadyMessage(): string {
  return AI_READY_MESSAGE;
}

export function getAiFailureMessage(context: AiStatusContext): string {
  return context === "create"
    ? "Task created, but AI generation failed. You can still open the task and continue without AI tips."
    : "Task updated, but AI generation failed. You can still open the task and continue without AI tips.";
}

export function getTaskAiStatusSnapshot(
  status: AiStepsGenerationStatus,
  updatedAt: Date,
  now: Date = new Date(),
): TaskAiStatusSnapshot {
  const isStalePending = isAiPendingStale(status, updatedAt, now);

  return {
    aiStepsGenerationStatus: status,
    isPending: status === "PENDING",
    isTerminal: isAiTerminalStatus(status),
    isStalePending,
    message: isStalePending ? getAiPendingStaleMessage() : undefined,
  };
}

export { STALE_AI_PENDING_THRESHOLD_MS };
