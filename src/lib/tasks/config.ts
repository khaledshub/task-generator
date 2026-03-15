export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
export const TASK_STARTER_STEP_MAX_LENGTH = 280;
export const TASK_LIST_ITEM_MAX_LENGTH = 140;
export const TASK_TIP_MAX_LENGTH = 200;
export const TASK_MAX_LIST_ITEMS = 20;
export const TASK_MAX_TIPS = 10;
export const TASK_MAX_TIME_MINUTES = 240;

export const TASK_FREQUENCIES = ["ONE_OFF", "DAILY", "WEEKLY", "MONTHLY"] as const;
export const TASK_CONTEXTS = ["HOME", "OUT", "COMPUTER"] as const;
export const TASK_TYPES = [
  "CHORE",
  "REPAIR",
  "BUSINESS",
  "HEALTH",
  "SOCIAL",
  "ADMIN",
] as const;
export const TASK_ENERGIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const TASK_AI_PROVIDERS = ["LOCAL", "OPENAI"] as const;
export const LOCAL_AI_MODELS = ["gpt-oss:20b", "qwen3-vl:8b", "qwen3-vl:4b"] as const;
export const TASK_TIME_OPTIONS = [5, 10, 15, 30, 60] as const;

export type TaskFrequencyValue = (typeof TASK_FREQUENCIES)[number];
export type TaskContextValue = (typeof TASK_CONTEXTS)[number];
export type TaskTypeValue = (typeof TASK_TYPES)[number];
export type TaskEnergyValue = (typeof TASK_ENERGIES)[number];
export type TaskAiProviderValue = (typeof TASK_AI_PROVIDERS)[number];
export type LocalAiModelValue = (typeof LOCAL_AI_MODELS)[number];

export function getDefaultTaskAiProvider(): TaskAiProviderValue {
  const configuredProvider = process.env.NEXT_PUBLIC_DEFAULT_AI_PROVIDER;

  if (
    configuredProvider &&
    TASK_AI_PROVIDERS.includes(configuredProvider as TaskAiProviderValue)
  ) {
    return configuredProvider as TaskAiProviderValue;
  }

  return TASK_AI_PROVIDERS[0];
}

export const TASK_FREQUENCY_LABELS: Record<TaskFrequencyValue, string> = {
  ONE_OFF: "One-off",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const TASK_CONTEXT_LABELS: Record<TaskContextValue, string> = {
  HOME: "Home",
  OUT: "Out",
  COMPUTER: "Computer",
};

export const TASK_TYPE_LABELS: Record<TaskTypeValue, string> = {
  CHORE: "Chore",
  REPAIR: "Repair",
  BUSINESS: "Business",
  HEALTH: "Health",
  SOCIAL: "Social",
  ADMIN: "Admin",
};

export const TASK_ENERGY_LABELS: Record<TaskEnergyValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const TASK_AI_PROVIDER_LABELS: Record<TaskAiProviderValue, string> = {
  OPENAI: "OpenAI",
  LOCAL: "LocalGenAI",
};

export const LOCAL_AI_MODEL_LABELS: Record<LocalAiModelValue, string> = {
  "gpt-oss:20b": "gpt-oss:20b",
  "qwen3-vl:8b": "qwen3-vl:8b",
  "qwen3-vl:4b": "qwen3-vl:4b",
};

export const DEFAULT_TASK_TIPS = [
  "Start with the 2-minute starter step before deciding whether to continue.",
  "Set a short timer and stop when it rings if momentum is low.",
] as const;
