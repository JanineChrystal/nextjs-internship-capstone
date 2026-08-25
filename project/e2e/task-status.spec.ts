import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";
import {
	boardColumn,
	createTaskOnBoard,
	openTask,
	withSave,
} from "./helpers/task";

/** status - derived for display, stored separately, and never "Overdue" in the editor. Runbook TSK-06, TSK-14, TSK-16. */
test.describe("task status", () => {
	test("keeps a hand-picked status after a reload", async ({ page }) => {
		const projectName = uniqueName("E2E Status");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal
			.locator('div.space-y-1:has(> span:text-is("Status")) button')
			.click();
		await withSave(page, () =>
			page.getByRole("menuitem", { name: "In Progress", exact: true }).click(),
		);

		await page.keyboard.press("Escape");
		await page.reload();

		const reopened = await openTask(page, taskName);
		await expect(
			reopened.locator('div.space-y-1:has(> span:text-is("Status")) button'),
		).toContainText("In Progress", { timeout: 20_000 });
	});

	test("offers three statuses and never Overdue", async ({ page }) => {
		const projectName = uniqueName("E2E Status Options");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal
			.locator('div.space-y-1:has(> span:text-is("Status")) button')
			.click();

		/** derived, so not selectable - offering it would let the form save a value it never stores. */
		const menu = page.getByRole("menu");
		await expect(menu.getByRole("menuitem")).toHaveText([
			"Not Started",
			"In Progress",
			"Completed",
		]);
		await expect(menu.getByRole("menuitem", { name: "Overdue" })).toHaveCount(
			0,
		);
	});

	test("returns an un-completed task to the column it came from", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Uncomplete");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "In Progress", taskName);

		/** flag Completed as the destination, so completing has somewhere to move the task to. */
		await boardColumn(page, "Completed").getByRole("button").first().click();
		await withSave(page, () =>
			page.getByRole("menuitem", { name: /completion/i }).click(),
		);

		const modal = await openTask(page, taskName);
		await withSave(page, () =>
			modal.getByRole("button", { name: "Toggle task completion" }).click(),
		);
		await expect(page.getByText("Task marked complete")).toBeVisible({
			timeout: 20_000,
		});

		await withSave(page, () =>
			modal.getByRole("button", { name: "Toggle task completion" }).click(),
		);
		await expect(page.getByText("Task reopened")).toBeVisible({
			timeout: 20_000,
		});

		await page.keyboard.press("Escape");
		await page.reload();

		/** back where it started - not the first column, and not left sitting in Completed. */
		await expect(
			boardColumn(page, "In Progress").getByRole("button", {
				name: taskName,
				exact: true,
			}),
		).toBeVisible({ timeout: 20_000 });
	});
});
