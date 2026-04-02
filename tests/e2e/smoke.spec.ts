import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import type { Page } from "@playwright/test";

const prisma = new PrismaClient();
const E2E_EMAIL_PREFIX = "e2e-smoke-";

test.describe("TodoList RandomGenerator smoke", () => {
  test.beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: E2E_EMAIL_PREFIX,
        },
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("signup -> login -> create task (genAI off) -> pick -> done -> history", async ({
    page,
  }) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `${E2E_EMAIL_PREFIX}${uniqueId}@example.com`;
    const password = "Password123!";
    const taskTitle = `E2E Task GenAI Off ${uniqueId}`;

    await signupAndLogin(page, email, password);
    await createTask(page, {
      taskTitle,
      generateAiStepsEnabled: false,
    });

    await page.goto("/app/pick");
    await page.getByRole("button", { name: "Pick my task" }).click();
    await expect(page.getByText("Why this was picked:")).toBeVisible();

    await page.getByRole("button", { name: "Done" }).first().click();
    await expect(page.getByText("Saved action: DONE.")).toBeVisible();

    await page.goto("/app/history");
    await expect(page.getByText(taskTitle).first()).toBeVisible();
    await expect(page.getByText("DONE").first()).toBeVisible();
  });

  test("signup -> login -> create task (genAI on) -> saved successfully", async ({
    page,
  }) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `${E2E_EMAIL_PREFIX}${uniqueId}@example.com`;
    const password = "Password123!";
    const taskTitle = `E2E Task GenAI On ${uniqueId}`;

    await signupAndLogin(page, email, password);
    await createTask(page, {
      taskTitle,
      generateAiStepsEnabled: true,
    });

    await page.goto("/app/tasks");
    await expect(page.getByText(taskTitle).first()).toBeVisible();
  });

  test("create task (genAI on) settles to ready after polling", async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `${E2E_EMAIL_PREFIX}${uniqueId}@example.com`;
    const password = "Password123!";
    const taskTitle = `E2E Task AI Ready ${uniqueId}`;

    await signupAndLogin(page, email, password);
    await mockAiLifecycle(page, "READY");

    await createTask(page, {
      taskTitle,
      generateAiStepsEnabled: true,
    });

    await expect(page.getByText("Task created.")).toBeVisible();
    await expect(
      page.getByText("AI tips are ready and available on the task details page."),
    ).toBeVisible();
  });

  test("edit task (genAI on) settles to failed after polling", async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `${E2E_EMAIL_PREFIX}${uniqueId}@example.com`;
    const password = "Password123!";
    const taskTitle = `E2E Task AI Failed ${uniqueId}`;

    await signupAndLogin(page, email, password);
    await createTask(page, {
      taskTitle,
      generateAiStepsEnabled: false,
    });

    await mockAiLifecycle(page, "FAILED");

    await page.goto("/app/tasks");
    await page.getByRole("link", { name: "Edit" }).first().click();

    const generateStepsToggle = page.getByRole("switch", {
      name: "Generate todo steps",
    });
    await ensureSwitchState(generateStepsToggle, true);
    await page.locator('input[name="starterStep"]').first().fill("Regenerate starter steps");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Task updated.")).toBeVisible();
    await expect(
      page.getByText(
        "Task updated, but AI generation failed. You can still open the task and continue without AI tips.",
      ),
    ).toBeVisible();
  });
});

async function signupAndLogin(page: Page, email: string, password: string) {
  await page.goto("/signup");
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('input[type="password"]').nth(1).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/login\?registered=1/);

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator("form").getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function createTask(
  page: Page,
  input: {
    taskTitle: string;
    generateAiStepsEnabled: boolean;
  },
) {
  await page.goto("/app/tasks");
  await page
    .getByRole("button", { name: /Create Task|New task modal/i })
    .first()
    .click();

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="title"]').first().fill(input.taskTitle);

  const generateStepsToggle = dialog.getByRole("switch", {
    name: "Generate todo steps",
  });
  await ensureSwitchState(generateStepsToggle, input.generateAiStepsEnabled);

  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Task created.")).toBeVisible();
}

async function ensureSwitchState(
  toggle: ReturnType<Page["getByRole"]>,
  checked: boolean,
) {
  const isChecked = (await toggle.getAttribute("aria-checked")) === "true";

  if (isChecked !== checked) {
    await toggle.click();
  }
}

async function mockAiLifecycle(
  page: Page,
  terminalStatus: "READY" | "FAILED",
) {
  await page.route("**/api/ai/starter-step", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        result: "in_progress",
        aiStepsGenerationStatus: "PENDING",
        message: "AI generation is already in progress for this task.",
      }),
    });
  });

  await page.route("**/api/tasks/*/ai-status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        aiStepsGenerationStatus: terminalStatus,
      }),
    });
  });
}
