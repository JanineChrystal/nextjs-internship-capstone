import { expect, type Page, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";
import { boardColumn, createTaskOnBoard, withSave } from "./helpers/task";

/**
 * drag a card - the MouseSensor needs 5px of movement before it starts, and
 * dnd-kit tracks each move, so the gesture is stepped rather than jumped.
 */
async function dragCardTo(
	page: Page,
	taskName: string,
	targetColumn: string,
): Promise<void> {
	const card = page.getByRole("button", { name: taskName, exact: true });
	const target = boardColumn(page, targetColumn);

	const from = await card.boundingBox();
	const to = await target.boundingBox();
	if (!from || !to) throw new Error("expected both the card and the column");

	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();

	for (let step = 1; step <= 10; step++) {
		await page.mouse.move(
			from.x + ((to.x + to.width / 2 - from.x) * step) / 10,
			from.y + ((to.y + 120 - from.y) * step) / 10,
		);
	}

	await page.mouse.up();
}

/** the board's gestures and the flag that means done. Runbook BRD-02, BRD-06. */
test.describe("board drag and drop", () => {
	test("moves a card into another column and keeps it there", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Drag");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		await dragCardTo(page, taskName, "In Progress");

		await expect(
			boardColumn(page, "In Progress").getByRole("button", {
				name: taskName,
				exact: true,
			}),
		).toBeVisible({ timeout: 20_000 });

		await page.waitForTimeout(2_000);
		await page.reload();

		await expect(
			boardColumn(page, "In Progress").getByRole("button", {
				name: taskName,
				exact: true,
			}),
		).toBeVisible({ timeout: 20_000 });
	});

	test("allows only one completion column", async ({ page }) => {
		const projectName = uniqueName("E2E Completion Flag");

		await createProject(page, projectName);
		await openProject(page, projectName);

		const doneBadge = page.getByTitle(
			"Completed tasks are moved into this column",
		);

		await boardColumn(page, "Completed").getByRole("button").first().click();
		await withSave(page, () =>
			page.getByRole("menuitem", { name: /completion/i }).click(),
		);
		await expect(doneBadge).toHaveCount(1, { timeout: 20_000 });

		/** setting it elsewhere clears it first - two would make "is this done?" ambiguous for every chart downstream. */
		await boardColumn(page, "In Progress").getByRole("button").first().click();
		await withSave(page, () =>
			page.getByRole("menuitem", { name: /completion/i }).click(),
		);

		await page.reload();
		await expect(doneBadge).toHaveCount(1, { timeout: 20_000 });
		await expect(
			boardColumn(page, "In Progress").getByTitle(
				"Completed tasks are moved into this column",
			),
		).toBeVisible();
	});
});
