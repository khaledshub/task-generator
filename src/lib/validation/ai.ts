import { z } from "zod";
import { LOCAL_AI_MODELS, TASK_AI_PROVIDERS } from "@/lib/tasks/config";

export const starterStepRequestSchema = z.object({
  taskId: z.string().min(8).max(100),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(1000).optional(),
  starterStepPrompt: z.string().trim().max(300).optional(),
  aiProvider: z.enum(TASK_AI_PROVIDERS).optional(),
  localModel: z.enum(LOCAL_AI_MODELS).optional(),
});

export type StarterStepRequestInput = z.infer<typeof starterStepRequestSchema>;
