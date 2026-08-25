import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject, switchView } from "./helpers/project";
import { createTaskOnBoard } from "./helpers/task";

/** the five views - each tab has to render real content, and the filter bar belongs to only three of them. Runbook PRJ-03, PRJ-04, PCAL-01. */
test.describe("project views", () => {
	test("renders every one of the five tabs", async ({ page }) => {
		const projectName = uniqueName("E2E Views");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		await switchView(page, "Grid");
		await expect(
			page.getByRole("heading", { name: "Task Grid" }),
		).toBeVisible();
		await expect(page.getByText(taskName).first()).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Add new task" }),
		).toBeVisible();

		await switchView(page, "Board");
		await expect(
			page.getByRole("heading", { name: "Kanban Board" }),
		).toBeVisible();

		await switchView(page, "Calendar");
		await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
		await expect(page.getByText("Upcoming Tasks Deadlines")).toBeVisible();

		await switchView(page, "Charts");
		/** no longer a placeholder - this tab used to render the literal text "Charts View Draft". */
		await expect(page.getByText("Charts View Draft")).toHaveCount(0);

		await switchView(page, "Settings");
		await expect(
			page.getByRole("heading", { name: "Project Settings" }),
		).toBeVisible({ timeout: 20_000 });
	});

	test("offers the filter on the three filterable views only", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Filters");

		await createProject(page, projectName);
		await openProject(page, projectName);

		const filter = page.getByRole("button", { name: "Filter" });

		for (const view of ["Grid", "Board", "Calendar"] as const) {
			await switchView(page, view);
			await expect(filter, `${view} should offer the filter`).toBeVisible();
		}

		for (const view of ["Charts", "Settings"] as const) {
			await switchView(page, view);
			await expect(filter, `${view} should not offer the filter`).toHaveCount(
				0,
			);
		}
	});

	test("shows the owner's settings sections and the danger zone", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Settings");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await switchView(page, "Settings");

		await expect(
			page.getByRole("heading", { name: "Project Settings" }),
		).toBeVisible({ timeout: 20_000 });

		/** owner only - archiving and deleting are the owner's alone, so a co-owner reaching Settings sees everything above this. */
		await expect(
			page.getByRole("button", { name: "Archive Project" }),
		).toBeVisible({ timeout: 20_000 });
		await expect(
			page.getByRole("button", { name: "Delete Project" }),
		).toBeEnabled();
	});

	test("requires the project name typed out before it will delete", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Confirm");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await switchView(page, "Settings");

		await page.getByRole("button", { name: "Delete Project" }).click();

		const modal = page
			.getByRole("dialog")
			.filter({ hasText: "Delete Project" });
		const confirmButton = modal.getByRole("button", { name: "Delete Project" });

		/** the gate - a wrong name leaves the button inert, which is the whole point of typing it. */
		await modal.locator("#confirmation").fill("not the project name");
		await expect(confirmButton).toBeDisabled();

		await modal.locator("#confirmation").fill(projectName);
		await expect(confirmButton).toBeEnabled();

		await modal.getByRole("button", { name: "Cancel" }).click();
		await expect(modal).toBeHidden();
	});

	test("keeps a task without a due date off the calendar", async ({ page }) => {
		const projectName = uniqueName("E2E Calendar");
		const taskName = uniqueName("E2E Undated");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		await switchView(page, "Calendar");
		await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();

		/** the "--" trap - an empty due date is stored as that string, which is truthy and becomes an Invalid Date if it is ever let through. */
		await expect(page.getByText(taskName)).toHaveCount(0);
	});
});
