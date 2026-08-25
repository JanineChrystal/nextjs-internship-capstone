import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject, switchView } from "./helpers/project";
import { createTaskOnBoard, openTask, pickTaskDate } from "./helpers/task";

/** the project calendar - tasks only, and three different things a day cell can do. Runbook PCAL-01, PCAL-03, PCAL-04, PCAL-05. */
test.describe("project calendar", () => {
	test("draws a dated task and opens it on a double click", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Cal Task");
		const taskName = uniqueName("E2E Dated");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await pickTaskDate(page, modal, "Due Date", 15);
		await page.keyboard.press("Escape");
		await expect(modal).toBeHidden();

		await switchView(page, "Calendar");

		/** the due date is next month, so the calendar has to be moved there. */
		await page.getByRole("button", { name: "Next period" }).click();

		const event = page.locator(".rbc-event").filter({ hasText: taskName });
		await expect(event).toBeVisible({ timeout: 20_000 });

		await event.dblclick();
		await expect(page.getByLabel("Task name")).toHaveValue(taskName, {
			timeout: 20_000,
		});
	});

	test("creates straight from a day with no what-would-you-like step", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Cal Create");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await switchView(page, "Calendar");

		const addButton = page.getByRole("button", { name: /^Create on / }).first();
		await addButton.click({ force: true });

		/** inside a project there is only one thing you could be creating. */
		await expect(page.getByLabel("Task name")).toBeVisible({
			timeout: 20_000,
		});
		await expect(page.getByText("Which project is this task for?")).toHaveCount(
			0,
		);

		/** the date came with the click - the picker opens already set rather than showing "--". */
		const dueDate = page
			.getByRole("dialog")
			.locator('div.space-y-1:has(> span:text-is("Due Date")) button');
		await expect(dueDate).not.toContainText("--");
	});

	test("filters the side panel by day and clears on a second click", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Cal Filter");
		const taskName = uniqueName("E2E Dated");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await pickTaskDate(page, modal, "Due Date", 15);
		await page.keyboard.press("Escape");
		await expect(modal).toBeHidden();

		await switchView(page, "Calendar");
		await page.getByRole("button", { name: "Next period" }).click();

		const panel = page
			.locator("div")
			.filter({
				has: page.getByRole("heading", { name: "Upcoming Tasks Deadlines" }),
			})
			.last();
		await expect(panel.getByText(taskName)).toBeVisible({ timeout: 20_000 });

		/** a day with nothing on it - the panel should empty, and no modal may open. */
		await page.getByRole("button", { name: "16", exact: true }).click();
		await expect(panel.getByText(taskName)).toHaveCount(0);
		await expect(page.getByLabel("Task name")).toHaveCount(0);

		/** clicking the same day again clears the filter rather than narrowing further. */
		await page.getByRole("button", { name: "16", exact: true }).click();
		await expect(panel.getByText(taskName)).toBeVisible({ timeout: 20_000 });
	});
});
