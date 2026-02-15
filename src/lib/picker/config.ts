import { TASK_CONTEXTS } from "@/lib/tasks/config";

export const INTENT_CONTEXT_OPTIONS = TASK_CONTEXTS;
export const INTENT_MODE_OPTIONS = ["CHILL", "NORMAL", "GRIND"] as const;
export const INTENT_TIME_OPTIONS = [10, 30, 60] as const;
export const PICK_ACTION_OPTIONS = ["STARTED", "DONE", "SKIPPED"] as const;
export const SKIPPED_REASON_OPTIONS = [
  "TOO_HARD",
  "NO_TIME",
  "NOT_TODAY",
  "BLOCKED",
  "OTHER",
] as const;

export type IntentModeValue = (typeof INTENT_MODE_OPTIONS)[number];
export type PickActionValue = (typeof PICK_ACTION_OPTIONS)[number];
export type SkippedReasonValue = (typeof SKIPPED_REASON_OPTIONS)[number];

export const INTENT_MODE_LABELS: Record<IntentModeValue, string> = {
  CHILL: "Chill",
  NORMAL: "Normal",
  GRIND: "Grind",
};

export const INTENT_TIME_LABELS: Record<(typeof INTENT_TIME_OPTIONS)[number], string> = {
  10: "10 minutes",
  30: "30 minutes",
  60: "60 minutes",
};

export const SKIPPED_REASON_LABELS: Record<SkippedReasonValue, string> = {
  TOO_HARD: "Too hard",
  NO_TIME: "No time",
  NOT_TODAY: "Not today",
  BLOCKED: "Blocked",
  OTHER: "Other",
};

/** Number of most recent picked tasks that should receive a recency penalty. */
export const RECENT_PICK_LOOKBACK_COUNT = 3;

/** Number of days where recently completed tasks receive a done penalty. */
export const RECENT_DONE_LOOKBACK_DAYS = 7;

/** Base candidate weight before fairness modifiers are applied. */
export const BASE_CANDIDATE_WEIGHT = 1;

/** Weight multiplier for tasks marked as currently avoided by the user. */
export const AVOIDING_TASK_WEIGHT_MULTIPLIER = 1.8;

/** Weight multiplier applied when a task appears in the last N picks. */
export const RECENT_PICK_WEIGHT_MULTIPLIER = 0.35;

/** Weight multiplier applied when a task was completed recently. */
export const RECENT_DONE_WEIGHT_MULTIPLIER = 0.5;

/** Additional minutes allowed when strict time match has no candidates. */
export const TIME_FALLBACK_WINDOW_MINUTES = 15;

/** Penalty applied to candidates only available through time fallback. */
export const TIME_FALLBACK_WEIGHT_MULTIPLIER = 0.6;

/** Lower bound to prevent candidates from reaching zero weight. */
export const MIN_CANDIDATE_WEIGHT = 0.05;
