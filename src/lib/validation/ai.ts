import { z } from "zod";
import {
  LOCAL_AI_MODELS,
  TASK_AI_PROVIDERS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_STARTER_STEP_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from "@/lib/tasks/config";

const aiRequestProviderFields = {
  aiProvider: z.enum(TASK_AI_PROVIDERS).optional(),
  localModel: z.enum(LOCAL_AI_MODELS).optional(),
};

function withAiProviderValidation<
  T extends z.ZodRawShape & {
    aiProvider: z.ZodTypeAny;
    localModel: z.ZodTypeAny;
  },
>(shape: T) {
  return z.object(shape).superRefine((value, context) => {
    const providerInput = value as {
      aiProvider?: string;
      localModel?: string;
    };

    if (providerInput.localModel && providerInput.aiProvider !== "LOCAL") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["localModel"],
        message: "Local model requires aiProvider to be LOCAL.",
      });
    }
  });
}

export const starterStepRequestSchema = withAiProviderValidation({
  taskId: z.string().min(8).max(100),
  title: z.string().trim().min(3).max(TASK_TITLE_MAX_LENGTH),
  description: z.string().trim().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
  starterStepPrompt: z.string().trim().max(TASK_STARTER_STEP_MAX_LENGTH).optional(),
  ...aiRequestProviderFields,
});

export type StarterStepRequestInput = z.infer<typeof starterStepRequestSchema>;

export const taskInsightsRequestSchema = withAiProviderValidation({
  taskId: z.string().min(8).max(100),
  title: z.string().trim().min(3).max(TASK_TITLE_MAX_LENGTH),
  description: z.string().trim().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
  starterStep: z.string().trim().max(TASK_STARTER_STEP_MAX_LENGTH).optional(),
  question: z.string().trim().min(1).max(500).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(600),
      }),
    )
    .max(20)
    .optional(),
  ...aiRequestProviderFields,
});

export type TaskInsightsRequestInput = z.infer<typeof taskInsightsRequestSchema>;
