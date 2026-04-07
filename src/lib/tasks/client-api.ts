import type { AiGenerationRequest } from "@/components/tasks/ai-status";
import type { AiStepsGenerationStatus } from "@/lib/tasks/ai-lifecycle";

export interface StartAiStarterStepResponse {
  result?: "ready" | "in_progress" | "error";
  aiStepsGenerationStatus?: AiStepsGenerationStatus;
  message?: string;
  error?: string;
  tips?: string[];
}

export interface GetTaskAiStatusResponse {
  aiStepsGenerationStatus?: AiStepsGenerationStatus;
  message?: string;
  error?: string;
}

export interface ClientApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

const STARTER_STEP_PATH = "/api/ai/starter-step";
const TASK_AI_STATUS_PATH_PREFIX = "/api/tasks";

/**
 * Starts AI starter-step generation for a task.
 */
export async function startAiStarterStep(
  payload: AiGenerationRequest,
  signal?: AbortSignal,
): Promise<ClientApiResponse<StartAiStarterStepResponse>> {
  const response = await fetch(STARTER_STEP_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  return {
    ok: response.ok,
    status: response.status,
    data: parseStartAiStarterStepResponse(await response.json().catch(() => ({}))),
  };
}

/**
 * Reads AI generation status for a task.
 */
export async function getTaskAiStatus(
  taskId: string,
  signal?: AbortSignal,
): Promise<ClientApiResponse<GetTaskAiStatusResponse>> {
  const encodedTaskId = encodeURIComponent(taskId);
  const response = await fetch(`${TASK_AI_STATUS_PATH_PREFIX}/${encodedTaskId}/ai-status`, {
    cache: "no-store",
    signal,
  });

  return {
    ok: response.ok,
    status: response.status,
    data: parseGetTaskAiStatusResponse(await response.json().catch(() => ({}))),
  };
}

export function parseStartAiStarterStepResponse(raw: unknown): StartAiStarterStepResponse {
  const source = toRecord(raw);

  return {
    result: toStartResult(source.result),
    aiStepsGenerationStatus: toAiStepsGenerationStatus(source.aiStepsGenerationStatus),
    message: toOptionalString(source.message),
    error: toOptionalString(source.error),
    tips: toStringArray(source.tips),
  };
}

export function parseGetTaskAiStatusResponse(raw: unknown): GetTaskAiStatusResponse {
  const source = toRecord(raw);

  return {
    aiStepsGenerationStatus: toAiStepsGenerationStatus(source.aiStepsGenerationStatus),
    message: toOptionalString(source.message),
    error: toOptionalString(source.error),
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const parsed = value.filter((item): item is string => typeof item === "string");
  return parsed.length > 0 ? parsed : undefined;
}

function toStartResult(
  value: unknown,
): StartAiStarterStepResponse["result"] {
  if (value === "ready" || value === "in_progress" || value === "error") {
    return value;
  }

  return undefined;
}

function toAiStepsGenerationStatus(
  value: unknown,
): AiStepsGenerationStatus | undefined {
  if (value === "PENDING" || value === "READY" || value === "FAILED" || value === "SKIPPED") {
    return value;
  }

  return undefined;
}
