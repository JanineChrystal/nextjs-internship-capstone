import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";
import { createTaskOnBoard, openTask, withSave } from "./helpers/task";

/** the task's own detail - assignees, checklist and links, each of which writes through its own action. Runbook TSK-02, TSK-03, TSK-17. */
test.describe("task details", () => {
	test("assigns a member and keeps the assignment", async ({ page }) => {
		const projectName = uniqueName("E2E Assign");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);

		/** the selector has no label of its own - it is the only control in the Assignees block. */
		await modal
			.locator('div.space-y-2:has(> span:text-is("Assignees")) button')
			.first()
			.click();

		const picker = page.locator("[data-radix-popper-content-wrapper]").last();
		const firstMember = picker.getByRole("button").first();
		await expect(firstMember).toBeVisible();
		const memberName = (await firstMember.innerText()).split("\n")[0].trim();

		await withSave(page, () => firstMember.click());
		await expect(page.getByText("Assignees updated")).toBeVisible({
			timeout: 20_000,
		});
		await page.keyboard.press("Escape");
		await page.keyboard.press("Escape");

		await page.reload();
		const reopened = await openTask(page, taskName);
		await expect(reopened.getByText(memberName).first()).toBeVisible({
			timeout: 20_000,
		});
	});

	test("keeps checklist items and their completed count", async ({ page }) => {
		const projectName = uniqueName("E2E Checklist");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);

		for (const title of ["Draft the copy", "Review with the team"]) {
			await modal.getByRole("button", { name: "Add Item" }).click();
			const field = modal.getByLabel("Checklist item").last();
			await field.fill(title);
			await withSave(page, () => field.blur());
		}

		await withSave(page, () =>
			modal
				.getByRole("button", { name: "Toggle checklist item" })
				.first()
				.click(),
		);

		await page.keyboard.press("Escape");
		await page.reload();

		const reopened = await openTask(page, taskName);
		await expect(reopened.getByLabel("Checklist item")).toHaveCount(2, {
			timeout: 20_000,
		});

		/** the count beside the heading - one of two ticked. */
		await expect(reopened.getByText("1/2")).toBeVisible();
	});

	test("keeps a link and completes a bare host into a URL", async ({
		page,
	}) => {
		const projectName = uniqueName("E2E Links");
		const taskName = uniqueName("E2E Task");

		await createProject(page, projectName);
		await openProject(page, projectName);
		await createTaskOnBoard(page, "To Do", taskName);

		const modal = await openTask(page, taskName);
		await modal.getByRole("button", { name: "Add link" }).click();

		const field = modal.getByPlaceholder("Paste link and press Enter");
		await field.fill("example.com/spec");
		await withSave(page, () => field.press("Enter"));

		await page.keyboard.press("Escape");
		await page.reload();

		const reopened = await openTask(page, taskName);
		const link = reopened.getByRole("link", { name: "example.com" });
		await expect(link).toBeVisible({ timeout: 20_000 });

		/**
		 * completed, not refused - a value with no scheme is prefixed with https
		 * rather than rejected, so the runbook's "not-a-url is refused" does not
		 * describe what the modal does.
		 */
		await expect(link).toHaveAttribute("href", "https://example.com/spec");
	});
});
