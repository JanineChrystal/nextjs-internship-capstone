import { expect, test } from "@playwright/test";
import { TODAY_DAY_OF_MONTH } from "./helpers/dates";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";
import {
	createTaskOnBoard,
	openTask,
	pickTaskDate,
	taskDateTrigger,
} from "./helpers/task";

/** task validation - the schedule rules a task is held to, which are the same two sentences projects use. Runbook TSK-12, TSK-13, TSK-17. */
test.describe("task validation", () => {
	test("refuses a due date that lands before the start date", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Task Dates");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);

		/** next month throughout - every day there is selectable, so the run never depends on today's date. */
		await pickTaskDate(page, modal, "Start Date", 20);
		await pickTaskDate(page, modal, "Due Date", 10);

		await expect(modal.getByRole("alert")).toHaveText(
			"Due date must be on or after the start date.",
		);

		/** rolled back, not stored - the due date keeps its previous value rather than the rejected one. */
		await expect(taskDateTrigger(modal, "Due Date")).not.toContainText("10");
	});

	test("refuses a start date after an existing due date", async ({ page }) => {
		const projectName = uniqueName("E2E Task Dates 2");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);

		/** the other direction - the rule is checked against the merged schedule, not the field that changed. */
		await pickTaskDate(page, modal, "Due Date", 10);
		await pickTaskDate(page, modal, "Start Date", 20);

		await expect(modal.getByRole("alert")).toHaveText(
			"Due date must be on or after the start date.",
		);
	});

	test("cannot offer a day in the past", async ({ page }) => {
		test.skip(
			TODAY_DAY_OF_MONTH === 1,
			"no earlier day in this month to check",
		);

		const projectName = uniqueName("E2E Task Past");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await taskDateTrigger(modal, "Start Date").click();

		/** disabled rather than refused - the picker never offers a past day, so the not-in-the-past rule has nothing to catch here. */
		const popover = page.locator("[data-radix-popper-content-wrapper]").last();
		const firstOfMonth = popover
			.locator('button[name="day"]:not(.day-outside)')
			.filter({ hasText: /^1$/ })
			.first();
		await expect(firstOfMonth).toBeDisabled();
	});

	test("accepts a due date on the same day as the start date", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Task Same Day");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await pickTaskDate(page, modal, "Start Date", 15);
		await pickTaskDate(page, modal, "Due Date", 15);

		/** the boundary again - equal dates are legitimate, and an off-by-one here would block a same-day task while passing every obvious case. */
		await expect(modal.getByRole("alert")).toHaveCount(0);
		await expect(taskDateTrigger(modal, "Due Date")).toContainText("15");
	});
});
