import { z } from "zod";
import {
  TASK_CONTEXTS,
  TASK_AI_PROVIDERS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_ENERGIES,
  TASK_FREQUENCIES,
  TASK_LIST_ITEM_MAX_LENGTH,
  TASK_MAX_LIST_ITEMS,
  TASK_MAX_TIME_MINUTES,
  TASK_MAX_TIPS,
  TASK_STARTER_STEP_MAX_LENGTH,
  TASK_TIP_MAX_LENGTH,
  TASK_TIME_OPTIONS,
  TASK_TITLE_MAX_LENGTH,
  TASK_TYPES,
} from "@/lib/tasks/config";

/**
 * Validates task create/edit payloads.
 */
export const taskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(TASK_TITLE_MAX_LENGTH, "Title is too long."),
  description: z
    .string()
    .trim()
    .max(TASK_DESCRIPTION_MAX_LENGTH, "Description is too long.")
    .optional(),
  frequency: z.enum(TASK_FREQUENCIES),
  context: z.enum(TASK_CONTEXTS),
  type: z.enum(TASK_TYPES),
  energy: z.enum(TASK_ENERGIES),
  timeEstimateMinutes: z
    .number()
    .int()
    .positive("Time estimate must be greater than zero.")
    .max(TASK_MAX_TIME_MINUTES, "Time estimate is too large."),
  avoiding: z.boolean(),
  generateAiStepsEnabled: z.boolean(),
  aiProvider: z.enum(TASK_AI_PROVIDERS),
  starterStep: z
    .string()
    .trim()
    .max(TASK_STARTER_STEP_MAX_LENGTH, "Starter step is too long."),
  checklistItems: z
    .array(z.string().max(TASK_LIST_ITEM_MAX_LENGTH, "Checklist item too long."))
    .max(TASK_MAX_LIST_ITEMS, "Too many checklist items."),
  tips: z
    .array(z.string().max(TASK_TIP_MAX_LENGTH, "Tip is too long."))
    .max(TASK_MAX_TIPS, "Too many tips."),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

/**
 * Builds task input payload from a submitted form.
 */
export function taskFormDataToInput(formData: FormData): TaskInput {
  const rawInput = {
    title: String(formData.get("title") ?? ""),
    description: normalizeOptionalText(String(formData.get("description") ?? "")),
    frequency: String(formData.get("frequency") ?? TASK_FREQUENCIES[0]),
    context: String(formData.get("context") ?? TASK_CONTEXTS[0]),
    type: String(formData.get("type") ?? TASK_TYPES[0]),
    energy: String(formData.get("energy") ?? TASK_ENERGIES[1]),
    timeEstimateMinutes: Number(
      formData.get("timeEstimateMinutes") ?? TASK_TIME_OPTIONS[3],
    ),
    avoiding: formData.get("avoiding") === "on",
    generateAiStepsEnabled: formData.get("generateAiStepsEnabled") === "on",
    aiProvider: String(formData.get("aiProvider") ?? TASK_AI_PROVIDERS[0]),
    starterStep: String(formData.get("starterStep") ?? ""),
    checklistItems: parseMultilineText(
      String(formData.get("checklistItems") ?? ""),
    ),
    tips: parseMultilineText(String(formData.get("tips") ?? "")),
  };

  const parsed = taskInputSchema.parse(rawInput);

  return {
    ...parsed,
    starterStep: resolveStarterStep(parsed.title, parsed.starterStep),
  };
}

/**
 * Splits multi-line text into a trimmed string list.
 */
export function parseMultilineText(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Converts empty strings to undefined to avoid writing blank optional values.
 */
export function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Returns a stable starter step fallback when the create flow omits manual entry.
 */
function resolveStarterStep(title: string, starterStep: string): string {
  const trimmedStarterStep = starterStep.trim();
  if (trimmedStarterStep.length > 0) {
    return trimmedStarterStep;
  }

  const trimmedTitle = title.trim();
  const fallback = `Open "${trimmedTitle}" and do the first tiny action.`;
  return fallback.slice(0, TASK_STARTER_STEP_MAX_LENGTH);
}
