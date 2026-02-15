import {
  AVOIDING_TASK_WEIGHT_MULTIPLIER,
  BASE_CANDIDATE_WEIGHT,
  MIN_CANDIDATE_WEIGHT,
  RECENT_PICK_LOOKBACK_COUNT,
  RECENT_PICK_WEIGHT_MULTIPLIER,
  RECENT_DONE_LOOKBACK_DAYS,
  RECENT_DONE_WEIGHT_MULTIPLIER,
  TIME_FALLBACK_WEIGHT_MULTIPLIER,
  TIME_FALLBACK_WINDOW_MINUTES,
  type IntentModeValue,
} from "@/lib/picker/config";
import type {
  CandidateScore,
  FairnessInputs,
  IntentInput,
  PickerResult,
  PickerTask,
} from "@/lib/picker/types";
import type { TaskEnergyValue } from "@/lib/tasks/config";

const MODE_TO_ALLOWED_ENERGIES: Record<IntentModeValue, TaskEnergyValue[]> = {
  CHILL: ["LOW"],
  NORMAL: ["LOW", "MEDIUM"],
  GRIND: ["LOW", "MEDIUM", "HIGH"],
};

const NO_MATCH_REASON =
  "No matching tasks. Try adding tasks for this context or loosening your filters.";

interface SelectTaskOptions {
  random?: () => number;
}

/**
 * Selects one task using weighted random and fairness rules.
 */
export function selectTaskForIntent(
  tasks: PickerTask[],
  intent: IntentInput,
  fairness: FairnessInputs,
  options: SelectTaskOptions = {},
): PickerResult {
  const random = options.random ?? Math.random;

  const contextAndEnergyMatches = tasks.filter((task) => {
    const allowedEnergies = MODE_TO_ALLOWED_ENERGIES[intent.modeChoice];

    return (
      task.context === intent.contextChoice &&
      allowedEnergies.includes(task.energy)
    );
  });

  if (contextAndEnergyMatches.length === 0) {
    return {
      status: "no_match",
      reason: NO_MATCH_REASON,
    };
  }

  const strictTimeMatches = contextAndEnergyMatches.filter(
    (task) => task.timeEstimateMinutes <= intent.timeAvailableMinutes,
  );

  const usedTimeFallback = strictTimeMatches.length === 0;

  const candidatePool =
    strictTimeMatches.length > 0
      ? strictTimeMatches
      : contextAndEnergyMatches.filter(
          (task) =>
            task.timeEstimateMinutes <=
            intent.timeAvailableMinutes + TIME_FALLBACK_WINDOW_MINUTES,
        );

  if (candidatePool.length === 0) {
    return {
      status: "no_match",
      reason:
        "No tasks fit your selected time. Add shorter tasks or choose more time.",
    };
  }

  const scoredCandidates = candidatePool.map((task) =>
    scoreCandidate(task, intent, fairness, usedTimeFallback),
  );

  const selected = chooseWeighted(scoredCandidates, random);

  return {
    status: "picked",
    task: selected.task,
    why: buildWhyLine(selected, intent),
    usedTimeFallback,
    consideredCandidates: scoredCandidates.length,
  };
}

/**
 * Applies fairness and priority multipliers to a candidate task.
 */
export function scoreCandidate(
  task: PickerTask,
  intent: IntentInput,
  fairness: FairnessInputs,
  usedTimeFallback: boolean,
): CandidateScore {
  let weight = BASE_CANDIDATE_WEIGHT;

  const hasAvoidingBoost = task.avoiding;
  const hasRecentPickPenalty = fairness.recentPickedTaskIds.has(task.id);
  const hasRecentDonePenalty = fairness.recentlyDoneTaskIds.has(task.id);
  const isTimeFallbackCandidate =
    usedTimeFallback && task.timeEstimateMinutes > intent.timeAvailableMinutes;

  if (hasAvoidingBoost) {
    weight *= AVOIDING_TASK_WEIGHT_MULTIPLIER;
  }

  if (hasRecentPickPenalty) {
    weight *= RECENT_PICK_WEIGHT_MULTIPLIER;
  }

  if (hasRecentDonePenalty) {
    weight *= RECENT_DONE_WEIGHT_MULTIPLIER;
  }

  if (isTimeFallbackCandidate) {
    weight *= TIME_FALLBACK_WEIGHT_MULTIPLIER;
  }

  return {
    task,
    weight: Math.max(weight, MIN_CANDIDATE_WEIGHT),
    isTimeFallbackCandidate,
    hasRecentPickPenalty,
    hasRecentDonePenalty,
    hasAvoidingBoost,
  };
}

/**
 * Picks one candidate using weighted random selection.
 */
export function chooseWeighted(
  candidates: CandidateScore[],
  random: () => number,
): CandidateScore {
  const totalWeight = candidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );

  let threshold = random() * totalWeight;

  for (const candidate of candidates) {
    threshold -= candidate.weight;
    if (threshold <= 0) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1];
}

/**
 * Builds a one-line explanation for why the task was selected.
 */
export function buildWhyLine(
  candidate: CandidateScore,
  intent: IntentInput,
): string {
  const reasons = [
    `Matches ${formatLabel(intent.contextChoice)} + ${intent.timeAvailableMinutes}min + ${formatLabel(intent.modeChoice)}`,
  ];

  if (candidate.hasAvoidingBoost) {
    reasons.push("prioritized because it is marked Avoiding");
  }

  if (!candidate.hasRecentPickPenalty) {
    reasons.push(
      `not picked in your last ${RECENT_PICK_LOOKBACK_COUNT} selections`,
    );
  }

  if (!candidate.hasRecentDonePenalty) {
    reasons.push(`not completed in the last ${RECENT_DONE_LOOKBACK_DAYS} days`);
  }

  if (candidate.isTimeFallbackCandidate) {
    reasons.push("slightly above your selected time with a fallback penalty");
  }

  return `${reasons.slice(0, 3).join("; ")}.`;
}

/**
 * Converts enum-like values into title-cased labels for explanation strings.
 */
function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
