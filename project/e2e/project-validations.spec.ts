import { expect, test } from "@playwright/test";
import { dayOffset } from "./helpers/dates";
import { uniqueName } from "./helpers/naming";
import {
	fillProjectForm,
	openCreateProjectDialog,
	projectLink,
} from "./helpers/project";

/** project validation - the exact refusal copy, since projects and tasks share one rule and drift between them is the failure to catch. Runbook PRJ-08, PRJ-09, PRJ-10. */
test.describe("project validation", () => {
	test("refuses an empty title", async ({ page }) => {
		const dialog = await openCreateProjectDialog(page);
		await dialog.getByRole("button", { name: "Create Project" }).click();

		await expect(dialog.getByText("Title is required")).toBeVisible();
		await expect(dialog).toBeVisible();
	});

	test("refuses a due date before the start date", async ({ page }) => {
		const dialog = await openCreateProjectDialog(page);
		await fillProjectForm(dialog, uniqueName("E2E Invalid"), {
			startDate: dayOffset(10),
			dueDate: dayOffset(3),
		});
		await dialog.getByRole("button", { name: "Create Project" }).click();

		await expect(
			dialog.getByText("Due date must be on or after the start date."),
		).toBeVisible();
		await expect(dialog).toBeVisible();
	});

	test("refuses a start date in the past", async ({ page }) => {
		const dialog = await openCreateProjectDialog(page);
		await fillProjectForm(dialog, uniqueName("E2E Past"), {
			startDate: dayOffset(-1),
			dueDate: dayOffset(5),
		});
		await dialog.getByRole("button", { name: "Create Project" }).click();

		await expect(
			dialog.getByText("Start date cannot be earlier than today."),
		).toBeVisible();
		await expect(dialog).toBeVisible();
	});

	test("accepts a start and due date on the same day", async ({ page }) => {
		const projectName = uniqueName("E2E Same Day");
		const sameMoment = dayOffset(3, 14);

		const dialog = await openCreateProjectDialog(page);
		await fillProjectForm(dialog, projectName, {
			startDate: sameMoment,
			dueDate: sameMoment,
		});
		await dialog.getByRole("button", { name: "Create Project" }).click();

		/** the boundary is the point - the rule rejects due before start, not due equal to start, so a one-day project is legitimate. */
		await expect(dialog).toBeHidden();
		await expect(projectLink(page, projectName)).toBeVisible({
			timeout: 20_000,
		});
		await expect(page.getByText("Project created")).toBeVisible({
			timeout: 20_000,
		});
	});

	test("offers all four priorities", async ({ page }) => {
		const dialog = await openCreateProjectDialog(page);

		/** Urgent is the one that goes missing - anywhere listing priorities by hand rather than reading the enum drops it. */
		await expect(dialog.locator("#priority option")).toHaveText([
			"Low",
			"Medium",
			"High",
			"Urgent",
		]);
	});
});
