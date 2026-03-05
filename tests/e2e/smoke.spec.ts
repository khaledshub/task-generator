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
    const password = "Password123";
    const taskTitle = `E2E Task GenAI Off ${uniqueId}`;

    await signupAndLogin(page, email, password);
    await createTask(page, {
      taskTitle,
      starterStep: "Start the task in 2 minutes",
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
    const password = "Password123";
    const taskTitle = `E2E Task GenAI On ${uniqueId}`;

    await signupAndLogin(page, email, password);
    await createTask(page, {
      taskTitle,
      starterStep: "Generate useful starter steps",
      generateAiStepsEnabled: true,
    });

    await page.goto("/app/tasks");
    await expect(page.getByText(taskTitle).first()).toBeVisible();
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
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function createTask(
  page: Page,
  input: {
    taskTitle: string;
    starterStep: string;
    generateAiStepsEnabled: boolean;
  },
) {
  await page.goto("/app/tasks");
  await page.getByRole("button", { name: "New task modal" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="title"]').first().fill(input.taskTitle);
  await dialog.locator('input[name="starterStep"]').first().fill(input.starterStep);

  const generateStepsToggle = dialog.getByRole("checkbox", {
    name: "Generate todo steps",
  });

  if (input.generateAiStepsEnabled) {
    await generateStepsToggle.check();
  } else {
    await generateStepsToggle.uncheck();
  }

  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Task created.")).toBeVisible();
}
