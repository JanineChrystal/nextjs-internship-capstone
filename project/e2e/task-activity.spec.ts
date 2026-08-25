import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";
import { createTaskOnBoard, openTask, withSave } from "./helpers/task";

/** the activity feed - effects are logged, not attempts, so a save that changed nothing must leave no trace. Runbook TSK-08. */
test.describe("task activity", () => {
	test("writes a row for a real change and none for a no-op save", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Activity");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal.getByRole("button", { name: "Activity", exact: true }).click();

		const entries = modal.getByRole("listitem");

		/** wait for the fetch - the panel loads on first show, so counting straight away reads zero and every later comparison is off by the rows that had not arrived. */
		await expect(modal.getByText("Loading activity...")).toBeHidden({
			timeout: 20_000,
		});
		await expect(entries.first()).toBeVisible({ timeout: 20_000 });
		const before = await entries.count();

		/** a no-op - focus the name and leave it without changing a character. */
		await modal.getByLabel("Task name").focus();
		await modal.getByLabel("Task name").blur();
		await page.waitForTimeout(2_000);

		await modal.getByRole("button", { name: "Comments", exact: true }).click();
		await modal.getByRole("button", { name: "Activity", exact: true }).click();
		expect(await entries.count()).toBe(before);

		/** a real change - the DAL compares the row before updating, so this one does produce a sentence. */
		await modal.getByLabel("Task name").fill(`${taskName} edited`);
		await withSave(page, () => modal.getByLabel("Task name").blur());

		await modal.getByRole("button", { name: "Comments", exact: true }).click();
		await modal.getByRole("button", { name: "Activity", exact: true }).click();
		await expect(entries).toHaveCount(before + 1, { timeout: 20_000 });
	});
});
