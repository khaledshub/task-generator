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
export const TASK_TIME_OPTIONS = [5, 10, 15, 30, 60] as const;

export type TaskFrequencyValue = (typeof TASK_FREQUENCIES)[number];
export type TaskContextValue = (typeof TASK_CONTEXTS)[number];
export type TaskTypeValue = (typeof TASK_TYPES)[number];
export type TaskEnergyValue = (typeof TASK_ENERGIES)[number];

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

export const DEFAULT_TASK_TIPS = [
  "Start with the 2-minute starter step before deciding whether to continue.",
  "Set a short timer and stop when it rings if momentum is low.",
] as const;
