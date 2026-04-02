import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  starterStepRequestSchema,
  taskInsightsRequestSchema,
} from "@/lib/validation/ai";

describe("AI request validation", () => {
  it("allows localModel when aiProvider is LOCAL", () => {
    const parsed = starterStepRequestSchema.parse({
      taskId: "task-12345",
      title: "Write report",
      aiProvider: "LOCAL",
      localModel: "gpt-oss:20b",
    });

    expect(parsed.localModel).toBe("gpt-oss:20b");
  });

  it("rejects localModel when aiProvider is OPENAI", () => {
    expect(() =>
      starterStepRequestSchema.parse({
        taskId: "task-12345",
        title: "Write report",
        aiProvider: "OPENAI",
        localModel: "gpt-oss:20b",
      }),
    ).toThrow(ZodError);
  });

  it("rejects localModel when aiProvider is omitted", () => {
    expect(() =>
      taskInsightsRequestSchema.parse({
        taskId: "task-12345",
        title: "Write report",
        localModel: "gpt-oss:20b",
      }),
    ).toThrow(ZodError);
  });
});
