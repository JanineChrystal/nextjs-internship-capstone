import { expect, type Locator, type Page } from "@playwright/test";

export type ProjectView = "Grid" | "Board" | "Calendar" | "Charts" | "Settings";

export interface CreateProjectFields {
	description?: string;
	priority?: "low" | "medium" | "high" | "urgent";
	status?: "active" | "completed" | "overdue" | "archived";
	startDate?: string;
	dueDate?: string;
}

/** create dialog - opened from the projects list, and the only dialog on that page. */
export async function openCreateProjectDialog(page: Page): Promise<Locator> {
	await page.goto("/projects");
	await page.getByRole("button", { name: "Create New Project" }).click();

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	return dialog;
}

/** fill the create form - every field is addressed by id, since the form labels a select and its wrapper alike. */
export async function fillProjectForm(
	dialog: Locator,
	title: string,
	fields: CreateProjectFields = {},
): Promise<void> {
	await dialog.locator("#title").fill(title);

	if (fields.description) {
		await dialog.locator("#description").fill(fields.description);
	}
	if (fields.priority) {
		await dialog.locator("#priority").selectOption(fields.priority);
	}
	if (fields.status) {
		await dialog.locator("#status").selectOption(fields.status);
	}
	if (fields.startDate) {
		await dialog.locator("#startDate").fill(fields.startDate);
	}
	if (fields.dueDate) {
		await dialog.locator("#dueDate").fill(fields.dueDate);
	}
}

/** create and confirm - the card has to be on the list before a test may rely on it. */
export async function createProject(
	page: Page,
	title: string,
	fields: CreateProjectFields = {},
): Promise<void> {
	const dialog = await openCreateProjectDialog(page);
	await fillProjectForm(dialog, title, fields);
	await dialog.getByRole("button", { name: "Create Project" }).click();

	await expect(dialog).toBeHidden();
	await expect(projectLink(page, title)).toBeVisible({ timeout: 20_000 });

	/**
	 * the toast, not the card - the card is optimistic and the modal closes
	 * before the write lands. Waited on rather than asserted, because it
	 * auto-dismisses; project-lifecycle asserts it properly.
	 */
	await page
		.getByText("Project created")
		.waitFor({ state: "visible", timeout: 20_000 })
		.catch(() => undefined);

	/** reload until the row is really there - every later step navigates away, so leaving on an optimistic card is what made the CRUD specs flake. */
	await expect(async () => {
		await page.reload();
		await expect(projectLink(page, title)).toBeVisible({ timeout: 10_000 });
	}).toPass({ timeout: 45_000 });
}

/** the card is a link - matching the title text alone also hits the heading inside it, which is not what a click should land on. */
export function projectLink(page: Page, title: string): Locator {
	return page
		.locator('a[href^="/projects/"]')
		.filter({ hasText: title })
		.first();
}

/** open a project - returns the detail URL, which several specs need to come back to. */
export async function openProject(page: Page, title: string): Promise<string> {
	await page.goto("/projects");

	const link = projectLink(page, title);
	await expect(link).toBeVisible({ timeout: 20_000 });
	await link.click();

	await page.waitForURL(/\/projects\/[0-9a-f-]{36}/);
	await expect(page.getByRole("heading", { name: "Kanban Board" })).toBeVisible(
		{
			timeout: 20_000,
		},
	);

	return page.url();
}

export async function switchView(page: Page, view: ProjectView): Promise<void> {
	await page.getByRole("button", { name: view, exact: true }).click();
}
