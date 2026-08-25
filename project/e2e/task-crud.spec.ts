import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject, switchView } from "./helpers/project";
import { createTaskOnBoard, openTask, withSave } from "./helpers/task";

/** task CRUD - the modal that every view opens, driven from the board. Runbook TSK-01, TSK-06, TSK-11, TSK-15. */
test.describe("task CRUD", () => {
	test("creates a task on a column and keeps it after a reload", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Tasks");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		await page.reload();
		await expect(
			page.getByRole("button", { name: taskName, exact: true }),
		).toBeVisible({
			timeout: 20_000,
		});
	});

	test("renames a task and shows the new name in the grid", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Rename");
		const taskName = uniqueName("E2E Task");
		const renamed = `${taskName} renamed`;

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal.getByLabel("Task name").fill(renamed);

		/** saved on blur - the name field commits when it loses focus, not on a submit button. */
		await withSave(page, () => modal.getByLabel("Task name").blur());

		await page.keyboard.press("Escape");
		await expect(modal).toBeHidden();

		await page.reload();
		await switchView(page, "Grid");

		/** the grid is the second reader - the board and the grid share one store, so a name that only changed in one is a real defect. */
		await expect(page.getByText(renamed).first()).toBeVisible({
			timeout: 20_000,
		});
	});

	test("changes priority from the modal", async ({ page }) => {
		const projectName = uniqueName("E2E Priority");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal
			.locator('div.space-y-1:has(> span:text-is("Priority")) button')
			.click();
		await withSave(page, () =>
			page.getByRole("menuitem", { name: "urgent", exact: true }).click(),
		);

		await page.keyboard.press("Escape");
		await page.reload();

		const card = page
			.locator("div")
			.filter({
				has: page.getByRole("button", { name: taskName, exact: true }),
			})
			.last();
		await expect(card).toContainText(/urgent/i, { timeout: 20_000 });
	});

	test("marks a task complete and reopens it", async ({ page }) => {
		const projectName = uniqueName("E2E Complete");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal.getByRole("button", { name: "Toggle task completion" }).click();
		await expect(page.getByText("Task marked complete")).toBeVisible({
			timeout: 20_000,
		});

		await modal.getByRole("button", { name: "Toggle task completion" }).click();
		await expect(page.getByText("Task reopened")).toBeVisible({
			timeout: 20_000,
		});
	});

	test("duplicates and then deletes a task", async ({ page }) => {
		const projectName = uniqueName("E2E Duplicate");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal.getByRole("button", { name: "More options" }).click();
		await page.getByRole("menuitem", { name: "Duplicate task" }).click();

		await expect(
			page.getByRole("button", { name: `${taskName} (Copy)`, exact: true }),
		).toBeVisible({ timeout: 20_000 });

		/** delete the copy - the original stays, which is what proves the delete hit one row rather than the pair. */
		const copy = await openTask(page, `${taskName} (Copy)`);
		await copy.getByRole("button", { name: "More options" }).click();
		await page.getByRole("menuitem", { name: "Delete task" }).click();

		await expect(
			page.getByRole("button", { name: `${taskName} (Copy)`, exact: true }),
		).toHaveCount(0, { timeout: 20_000 });
		await expect(
			page.getByRole("button", { name: taskName, exact: true }),
		).toBeVisible();
	});
});
