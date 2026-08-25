import { expect, test } from "@playwright/test";
import { resetFilters, toggleFilter } from "./helpers/filters";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject, switchView } from "./helpers/project";
import { createTaskOnBoard, openTask, withSave } from "./helpers/task";

/** filters - asserts the effect, not the presence of the control, which is the part that can silently stop working. Runbook PRJ-04. */
test.describe("task filters", () => {
	test("narrows the board to the chosen priority and restores on reset", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Filter");
		const urgentTask = uniqueName("E2E Urgent");
		const ordinaryTask = uniqueName("E2E Ordinary");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", urgentTask);
		await createTaskOnBoard(page, "To Do", ordinaryTask);

		const modal = await openTask(page, urgentTask);
		await modal
			.locator('div.space-y-1:has(> span:text-is("Priority")) button')
			.click();
		await withSave(page, () =>
			page.getByRole("menuitem", { name: "urgent", exact: true }).click(),
		);
		await page.keyboard.press("Escape");
		await expect(modal).toBeHidden();

		await toggleFilter(page, "Priority", "urgent");

		await expect(
			page.getByRole("button", { name: urgentTask, exact: true }),
		).toBeVisible({ timeout: 20_000 });
		await expect(
			page.getByRole("button", { name: ordinaryTask, exact: true }),
		).toHaveCount(0);

		await resetFilters(page);
		await expect(
			page.getByRole("button", { name: ordinaryTask, exact: true }),
		).toBeVisible({ timeout: 20_000 });
	});

	test("carries the filter across to the grid", async ({ page }) => {
		const projectName = uniqueName("E2E Filter Grid");
		const kept = uniqueName("E2E Kept");
		const hidden = uniqueName("E2E Hidden");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", kept);
		await createTaskOnBoard(page, "In Progress", hidden);

		/** board, which is also the status - filtering by column has to hold when the view changes. */
		await toggleFilter(page, "Board", "To Do");
		await switchView(page, "Grid");

		await expect(page.getByText(kept).first()).toBeVisible({ timeout: 20_000 });
		await expect(page.getByText(hidden)).toHaveCount(0);
	});
});
