import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, projectLink } from "./helpers/project";

/** bulk actions - one operation and one toast across a selection, not one per row. Runbook PRJ-05. */
test.describe("project bulk actions", () => {
	test("archives two projects in one operation", async ({ page }) => {
		const first = uniqueName("E2E Bulk A");
		const second = uniqueName("E2E Bulk B");

		await createProject(page, first);
		await createProject(page, second);

		await page.goto("/projects");
		await page.getByRole("checkbox", { name: `Select ${first}` }).click();
		await page.getByRole("checkbox", { name: `Select ${second}` }).click();

		/** the bar counts the selection - it only mounts once something is selected. */
		await expect(page.getByText("Selected")).toBeVisible();
		await expect(page.getByText("2", { exact: true }).first()).toBeVisible();

		await page.getByRole("button", { name: "Archive", exact: true }).click();

		const confirm = page.getByRole("alertdialog");
		if (await confirm.isVisible().catch(() => false)) {
			await confirm.getByRole("button", { name: /archive/i }).click();
		}

		await expect(projectLink(page, first)).toHaveCount(0, { timeout: 20_000 });
		await expect(projectLink(page, second)).toHaveCount(0);

		await page.goto("/archive");
		await expect(page.getByText(first).first()).toBeVisible({
			timeout: 20_000,
		});
		await expect(page.getByText(second).first()).toBeVisible();
	});

	test("deletes two projects in one operation", async ({ page }) => {
		const first = uniqueName("E2E Bulk C");
		const second = uniqueName("E2E Bulk D");

		await createProject(page, first);
		await createProject(page, second);

		await page.goto("/projects");
		await page.getByRole("checkbox", { name: `Select ${first}` }).click();
		await page.getByRole("checkbox", { name: `Select ${second}` }).click();

		await page.getByRole("button", { name: "Delete", exact: true }).click();

		/** the copy is built from the count - a bulk delete must not say "this project". */
		const confirm = page.getByRole("alertdialog");
		await expect(confirm).toBeVisible();
		await expect(confirm).toContainText(/2 projects/i);
		await confirm.getByRole("button", { name: /delete/i }).click();

		await expect(projectLink(page, first)).toHaveCount(0, { timeout: 20_000 });
		await expect(projectLink(page, second)).toHaveCount(0);

		await page.goto("/archive");
		await page.getByRole("button", { name: "Trash", exact: true }).click();
		await expect(page.getByText(first).first()).toBeVisible({
			timeout: 20_000,
		});
	});

	test("clears the selection without touching anything", async ({ page }) => {
		const only = uniqueName("E2E Bulk E");
		await createProject(page, only);

		await page.goto("/projects");
		await page.getByRole("checkbox", { name: `Select ${only}` }).click();
		await expect(page.getByText("Selected")).toBeVisible();

		/** the X in the bar - dismissing a selection is not an action on the rows. */
		await page
			.getByText("Selected")
			.locator("xpath=following-sibling::button[1]")
			.click();

		await expect(page.getByText("Selected")).toBeHidden();
		await expect(projectLink(page, only)).toBeVisible();
	});
});
