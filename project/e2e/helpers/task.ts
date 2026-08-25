import { expect, type Locator, type Page } from "@playwright/test";

/** the task editor - identified by its name field, since the dialog's own title is screen-reader only. */
export function taskModal(page: Page): Locator {
	return page.getByRole("dialog").filter({ has: page.getByLabel("Task name") });
}

/** create from a board column - the column's own button, so the task lands on a known board. */
export async function createTaskOnBoard(
	page: Page,
	columnTitle: string,
	taskName: string,
): Promise<void> {
	const column = boardColumn(page, columnTitle);
	await column.getByRole("button", { name: "Add Tasks" }).click();

	const modal = taskModal(page);
	await expect(modal.getByLabel("Task name")).toBeVisible();

	/**
	 * wait for the column to arrive - the modal opens on the default board and
	 * adopts the one that opened it a tick later. Submitting before that leaves
	 * the task on a board this project has no column for, so no card is drawn.
	 */
	await expect(
		modal.locator('div.space-y-1:has(> span:text-is("Board")) button'),
	).toContainText(columnTitle, { timeout: 10_000 });

	await modal.getByLabel("Task name").fill(taskName);
	await modal.getByRole("button", { name: "Create Task" }).click();

	await expect(modal).toBeHidden();
	await expect(
		page.getByRole("button", { name: taskName, exact: true }),
	).toBeVisible({ timeout: 20_000 });

	/** the toast is the write - the card is optimistic, so navigating before it lands aborts the request. */
	await expect(page.getByText("Task created")).toBeVisible({
		timeout: 20_000,
	});
}

/** a board column - located by its heading rather than position, which changes as columns are dragged. */
export function boardColumn(page: Page, title: string): Locator {
	return page
		.locator("div")
		.filter({ has: page.getByRole("heading", { name: title, exact: false }) })
		.filter({ has: page.getByRole("button", { name: "Add Tasks" }) })
		.last();
}

export async function openTask(page: Page, taskName: string): Promise<Locator> {
	/** exact - dnd-kit gives the card and its column role="button" too, and their composed names both contain the task name. */
	await page.getByRole("button", { name: taskName, exact: true }).click();

	const modal = taskModal(page);
	await expect(modal.getByLabel("Task name")).toHaveValue(taskName, {
		timeout: 20_000,
	});
	return modal;
}

/**
 * wait for the save - a routine field edit is deliberately silent, so the
 * action's own response is the only signal that reloading is safe.
 */
export async function withSave(
	page: Page,
	action: () => Promise<void>,
): Promise<void> {
	/** the next-action header - an RSC prefetch is a POST to the same URL, so the method alone matches the wrong request. */
	const saved = page.waitForResponse(
		(response) => Boolean(response.request().headers()["next-action"]),
		{ timeout: 20_000 },
	);
	await action();
	await saved;

	/** a breath after the response - the revalidation it triggers has to land before anything reloads. */
	await page.waitForTimeout(2_500);
}

/** date field - each picker is a labelled cell whose only control is the trigger button. */
export function taskDateTrigger(
	modal: Locator,
	label: "Start Date" | "Due Date",
): Locator {
	return modal.locator(`div.space-y-1:has(> span:text-is("${label}")) button`);
}

/**
 * pick a date - always in the following month, where every day is selectable.
 * Picking inside the current month would depend on what day the suite runs.
 */
export async function pickTaskDate(
	page: Page,
	modal: Locator,
	label: "Start Date" | "Due Date",
	dayOfMonth: number,
): Promise<void> {
	await taskDateTrigger(modal, label).click();

	const popover = page.locator("[data-radix-popper-content-wrapper]").last();
	await expect(popover.locator('button[name="day"]').first()).toBeVisible();

	await popover.locator('button[name="next-month"]').click();
	await popover
		.locator('button[name="day"]')
		.filter({ hasText: new RegExp(`^${dayOfMonth}$`) })
		.first()
		.click();

	await page.keyboard.press("Escape");
}
