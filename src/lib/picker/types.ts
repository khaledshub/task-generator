import type { TaskContextValue, TaskEnergyValue } from "@/lib/tasks/config";
import type { IntentModeValue } from "@/lib/picker/config";

export interface IntentInput {
  contextChoice?: TaskContextValue;
  modeChoice?: IntentModeValue;
  timeAvailableMinutes?: number;
}

export interface PickerTask {
  id: string;
  title: string;
  context: TaskContextValue;
  energy: TaskEnergyValue;
  timeEstimateMinutes: number;
  avoiding: boolean;
  starterStep: string;
  checklistItems: string[];
  tips: string[];
}

export interface FairnessInputs {
  recentPickedTaskIds: Set<string>;
  recentlyDoneTaskIds: Set<string>;
}

export interface CandidateScore {
  task: PickerTask;
  weight: number;
  isTimeFallbackCandidate: boolean;
  hasRecentPickPenalty: boolean;
  hasRecentDonePenalty: boolean;
  hasAvoidingBoost: boolean;
}

export interface PickerSuccess {
  status: "picked";
  task: PickerTask;
  why: string;
  usedTimeFallback: boolean;
  consideredCandidates: number;
}

export interface PickerNoMatch {
  status: "no_match";
  reason: string;
}

export type PickerResult = PickerSuccess | PickerNoMatch;
