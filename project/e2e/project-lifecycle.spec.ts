import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";

/** critical flow - creating a project and proving it was stored. Runbook PRJ-01, PRJ-02. */
test.describe("project lifecycle", () => {
	test("creates a project that survives a reload", async ({ page }) => {
		const projectName = uniqueName("E2E Project");

		await page.goto("/projects");

		await page.getByRole("button", { name: "Create New Project" }).click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		await dialog.getByPlaceholder("Enter project name...").fill(projectName);
		await dialog.getByRole("button", { name: "Create Project" }).click();

		await expect(dialog).toBeHidden();
		await expect(page.getByText(projectName).first()).toBeVisible();

		/** the reload is the assertion - appearing in the list only proves the optimistic update ran. */
		await page.reload();
		await expect(page.getByText(projectName).first()).toBeVisible();
	});

	test("opens the project and lands on the board view", async ({ page }) => {
		await page.goto("/projects");

		/** any project - this checks the detail route renders, so pinning it to a fixture would fail for unrelated reasons. */
		const firstProject = page.locator('a[href^="/projects/"]').first();
		await expect(firstProject).toBeVisible();
		await firstProject.click();

		await page.waitForURL(/\/projects\/[0-9a-f-]{36}/);

		/** board, not grid - the view resets to board on mount, and the skeleton used to draw a table here. Runbook FIX-01. */
		await expect(
			page.getByRole("button", { name: "Board", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Kanban Board" }),
		).toBeVisible();
	});
});
