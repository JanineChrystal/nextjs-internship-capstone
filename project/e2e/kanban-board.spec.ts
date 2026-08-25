import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";
import {
	boardColumn,
	createTaskOnBoard,
	openTask,
	withSave,
} from "./helpers/task";

/** the board - columns, the column that means done, and the count a delete has to name first. Runbook BRD-01, BRD-03, BRD-04, BRD-06. */
test.describe("kanban board", () => {
	test("seeds three columns on a new project", async ({ page }) => {
		const projectName = uniqueName("E2E Board");

		await createProject(page, projectName);
		await openProject(page, projectName);

		for (const column of ["To Do", "In Progress", "Completed"]) {
			await expect(page.getByRole("heading", { name: column })).toBeVisible();
		}
	});

	test("adds a column and renames it", async ({ page }) => {
		const projectName = uniqueName("E2E Columns");

		await createProject(page, projectName);
		await openProject(page, projectName);

		await page.getByRole("button", { name: "Add Board" }).click();
		await expect(
			page.getByRole("heading", { name: "New Column 4" }),
		).toBeVisible({ timeout: 20_000 });

		const column = boardColumn(page, "New Column 4");
		await column.getByRole("button").first().click();
		await page.getByRole("menuitem", { name: /rename/i }).click();

		/** typed, not filled - renaming swaps the heading for an autofocused input, so the locator that found the column no longer matches it. */
		const renamed = "Ready for QA";
		await page.keyboard.press("ControlOrMeta+a");
		await page.keyboard.type(renamed);
		await withSave(page, () => page.keyboard.press("Enter"));

		await page.reload();
		await expect(page.getByRole("heading", { name: renamed })).toBeVisible({
			timeout: 20_000,
		});
	});

	test("names the task count before deleting a column that holds tasks", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Column Delete");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const column = boardColumn(page, "To Do");
		await column.getByRole("button").first().click();
		await page.getByRole("menuitem", { name: /delete/i }).click();

		/** not a silent cascade - the count is fetched first so the confirmation can say it out loud. */
		const warning = page.getByRole("alertdialog");
		await expect(warning).toContainText("1 task");
		await expect(warning).toContainText("trash");

		await warning.getByRole("button", { name: "Cancel" }).click();
		await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
	});

	test("moves a completed task into the completion column", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Completion");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		/** flag the column first - without one, completion is still recorded and the task simply stays where it is. */
		const completed = boardColumn(page, "Completed");
		await completed.getByRole("button").first().click();
		await page.getByRole("menuitem", { name: /completion/i }).click();

		const modal = await openTask(page, taskName);
		await modal.getByRole("button", { name: "Toggle task completion" }).click();
		await expect(page.getByText("Task marked complete")).toBeVisible({
			timeout: 20_000,
		});
		await page.keyboard.press("Escape");

		await page.reload();
		await expect(
			boardColumn(page, "Completed").getByRole("button", {
				name: taskName,
				exact: true,
			}),
		).toBeVisible({ timeout: 20_000 });
	});
});
