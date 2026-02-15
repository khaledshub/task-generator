import { z } from "zod";
import {
  INTENT_CONTEXT_OPTIONS,
  INTENT_MODE_OPTIONS,
  INTENT_TIME_OPTIONS,
  PICK_ACTION_OPTIONS,
  SKIPPED_REASON_OPTIONS,
} from "@/lib/picker/config";

/**
 * Validates intent payload submitted from the picker screen.
 */
export const intentInputSchema = z.object({
  contextChoice: z.enum(INTENT_CONTEXT_OPTIONS),
  modeChoice: z.enum(INTENT_MODE_OPTIONS),
  timeAvailableMinutes: z
    .number()
    .int()
    .refine((minutes) => INTENT_TIME_OPTIONS.includes(minutes as 10 | 30 | 60), {
      message: "Time choice must be 10, 30, or 60 minutes.",
    }),
});

export type IntentPayload = z.infer<typeof intentInputSchema>;

/**
 * Validates status actions recorded after a task is picked.
 */
export const pickEventActionSchema = z
  .object({
    taskId: z.string().min(1),
    intentId: z.string().min(1).optional(),
    action: z.enum(PICK_ACTION_OPTIONS),
    skippedReason: z.enum(SKIPPED_REASON_OPTIONS).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.action === "SKIPPED" && !payload.skippedReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["skippedReason"],
        message: "Skipped reason is required when action is SKIPPED.",
      });
    }

    if (payload.action !== "SKIPPED" && payload.skippedReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["skippedReason"],
        message: "Skipped reason is only valid for SKIPPED actions.",
      });
    }
  });

export type PickEventActionPayload = z.infer<typeof pickEventActionSchema>;
