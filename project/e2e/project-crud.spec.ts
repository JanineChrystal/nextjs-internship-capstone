import { expect, test } from "@playwright/test";
import { dayOffset } from "./helpers/dates";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject, projectLink } from "./helpers/project";

/** project CRUD - create, edit, archive and delete against the real database. Runbook PRJ-01, PRJ-05, PRJ-07, PRJ-12. */
test.describe("project CRUD", () => {
	test("creates a project with every field filled and reads it back", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Full");

		await createProject(page, projectName, {
			description: "Created by the end-to-end suite.",
			priority: "high",
			startDate: dayOffset(1),
			dueDate: dayOffset(14),
		});

		await page.reload();
		const card = projectLink(page, projectName);
		await expect(card).toBeVisible({ timeout: 20_000 });

		/** the card carries the values back - a create that stored only the title would still pass a title-only assertion. */
		await expect(card).toContainText("Created by the end-to-end suite.");
		await expect(card).toContainText("high");
		await expect(card).toContainText("active");
	});

	test("edits the description on its own", async ({ page }) => {
		const projectName = uniqueName("E2E Edit");
		const revised = "Edited by the end-to-end suite.";

		await createProject(page, projectName, { description: "First draft." });
		await openProject(page, projectName);

		await page.getByRole("button", { name: "Edit" }).click();

		const description = page.locator("#description");
		await expect(description).toBeVisible();
		await description.fill(revised);
		await page.getByRole("button", { name: "Save" }).click();

		/** partial edit - the edit schema validates only what was sent, so leaving the dates untouched must not be refused. */
		await expect(page.getByText(revised).first()).toBeVisible({
			timeout: 20_000,
		});

		await page.reload();
		await expect(page.getByText(revised).first()).toBeVisible({
			timeout: 20_000,
		});
	});

	test("archives a project out of the active list", async ({ page }) => {
		const projectName = uniqueName("E2E Archive");
		await createProject(page, projectName);

		await page.goto("/projects");
		await projectLink(page, projectName).hover();
		await page.getByRole("button", { name: `Archive ${projectName}` }).click();

		await expect(page.getByText("Project archived")).toBeVisible({
			timeout: 20_000,
		});

		await page.goto("/archive");
		await expect(page.getByText(projectName).first()).toBeVisible({
			timeout: 20_000,
		});
	});

	test("deletes a project into the trash rather than out of existence", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Delete");
		await createProject(page, projectName);

		await page.goto("/projects");
		await projectLink(page, projectName).hover();
		await page.getByRole("button", { name: `Delete ${projectName}` }).click();

		const confirm = page.getByRole("alertdialog");
		await expect(confirm).toBeVisible();
		await confirm.getByRole("button", { name: /delete/i }).click();

		await expect(projectLink(page, projectName)).toHaveCount(0, {
			timeout: 20_000,
		});

		/** trash, not gone - the row is retained for the restore window. Runbook PRJ-07. */
		await page.goto("/archive");
		await page.getByRole("button", { name: "Trash", exact: true }).click();
		await expect(page.getByText(projectName).first()).toBeVisible({
			timeout: 20_000,
		});
	});
});
