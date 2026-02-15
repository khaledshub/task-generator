import { expect, test } from "@playwright/test";

const runE2E = process.env.RUN_E2E === "1";

test.describe("TodoList RandomGenerator smoke", () => {
  test.skip(!runE2E, "Set RUN_E2E=1 with Postgres and migrations running.");

  test("signup -> login -> create task -> pick -> done -> history", async ({
    page,
  }) => {
    const uniqueId = Date.now();
    const email = `e2e-${uniqueId}@example.com`;
    const password = "Password123";
    const taskTitle = `E2E Task ${uniqueId}`;

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

    await page.goto("/app/tasks");
    await page.locator('input[name="title"]').first().fill(taskTitle);
    await page
      .locator('input[name="starterStep"]')
      .first()
      .fill("Start the task in 2 minutes");
    await page.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByText("Task created.")).toBeVisible();

    await page.goto("/app/pick");
    await page.getByRole("button", { name: "Pick my task" }).click();
    await expect(page.getByText("Why this was picked:")).toBeVisible();

    await page.getByRole("button", { name: "Done" }).first().click();
    await expect(page.getByText("Saved action: DONE.")).toBeVisible();

    await page.goto("/app/history");
    await expect(page.getByText(taskTitle).first()).toBeVisible();
    await expect(page.getByText("DONE").first()).toBeVisible();
  });
});
