import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { taskFormDataToInput } from "@/lib/validation/task";

function createValidFormData(): FormData {
  const formData = new FormData();
  formData.set("title", "Pay utility bill");
  formData.set("description", "Handle this before Friday");
  formData.set("frequency", "ONE_OFF");
  formData.set("context", "HOME");
  formData.set("type", "ADMIN");
  formData.set("energy", "LOW");
  formData.set("timeEstimateMinutes", "15");
  formData.set("avoiding", "on");
  formData.set("starterStep", "Open the banking app");
  formData.set("checklistItems", "Open app\nFind bill section\nSubmit payment");
  formData.set("tips", "Set a 10-min timer\nIgnore perfection");
  return formData;
}

describe("task input validation", () => {
  it("parses valid task form data", () => {
    const parsed = taskFormDataToInput(createValidFormData());

    expect(parsed.title).toBe("Pay utility bill");
    expect(parsed.avoiding).toBe(true);
    expect(parsed.checklistItems).toEqual([
      "Open app",
      "Find bill section",
      "Submit payment",
    ]);
    expect(parsed.tips).toEqual(["Set a 10-min timer", "Ignore perfection"]);
  });

  it("requires starterStep", () => {
    const formData = createValidFormData();
    formData.set("starterStep", "");

    try {
      taskFormDataToInput(formData);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      if (error instanceof ZodError) {
        expect(error.issues[0]?.message).toBe("Starter step is required.");
      }
    }
  });

  it("rejects unsupported time values", () => {
    const formData = createValidFormData();
    formData.set("timeEstimateMinutes", "500");

    expect(() => taskFormDataToInput(formData)).toThrow(ZodError);
  });
});
