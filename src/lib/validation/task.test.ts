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

  it("generates a fallback starterStep when omitted", () => {
    const formData = createValidFormData();
    formData.set("starterStep", "");
    const parsed = taskFormDataToInput(formData);
    expect(parsed.starterStep).toContain('Open "Pay utility bill"');
  });

  it("rejects unsupported time values", () => {
    const formData = createValidFormData();
    formData.set("timeEstimateMinutes", "500");

    expect(() => taskFormDataToInput(formData)).toThrow(ZodError);
  });
});
