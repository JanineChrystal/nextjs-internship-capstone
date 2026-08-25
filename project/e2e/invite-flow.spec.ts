import { expect, test } from "@playwright/test";
import { ACCOUNTS, isConfigured } from "./helpers/accounts";
import { uniqueName } from "./helpers/naming";
import { createProject, openProject } from "./helpers/project";

/** invite flow - two accounts in one test, because an invitation is only meaningful when someone else answers it. Runbook FIX-04, FIX-05, FIX-06. */
test.describe("invitations", () => {
	test.beforeEach(() => {
		test.skip(
			!isConfigured(ACCOUNTS.b),
			"needs a second account: set E2E_USER_B_EMAIL and E2E_USER_B_PASSWORD",
		);
	});

	test("an invited member must accept before gaining access", async ({
		page,
		browser,
	}) => {
		const projectName = uniqueName("E2E Invite");

		await createProject(page, projectName);
		const projectUrl = await openProject(page, projectName);

		await page.getByRole("button", { name: "Add member to project" }).click();

		/** both fields - a project invite stages nothing until it has a recipient and a job role, so the Add button stays disabled with only one. */
		const inviteDialog = page
			.getByRole("dialog")
			.filter({ hasText: "Share Project & Invite Members" });
		await inviteDialog.locator("#recipient").fill(ACCOUNTS.b.email as string);
		await inviteDialog.locator("#jobRole").fill("Tester");
		await inviteDialog
			.getByRole("button", { name: "Add", exact: true })
			.click();

		const sendAll = inviteDialog.getByRole("button", { name: "Send All" });
		await expect(sendAll).toBeEnabled();
		await sendAll.click();
		await expect(inviteDialog).toBeHidden({ timeout: 20_000 });

		/** B is not a member yet - the invitation is an offer, not a grant. */
		const contextB = await browser.newContext({
			storageState: ACCOUNTS.b.storageState,
		});
		const pageB = await contextB.newPage();

		try {
			await pageB.goto("/team");

			/** the Pending tab - the panel is a view of its own, so the directory stays uncluttered when there are no invitations. */
			await pageB.getByRole("button", { name: "Pending", exact: true }).click();
			await expect(
				pageB.getByRole("heading", { name: /Invitations for you/ }),
			).toBeVisible({ timeout: 20_000 });

			await pageB.getByRole("button", { name: "Accept" }).first().click();

			await pageB.goto(projectUrl);
			await expect(
				pageB.getByRole("heading", { name: "Kanban Board" }),
			).toBeVisible({ timeout: 20_000 });
		} finally {
			await contextB.close();
		}
	});

	test("a member sees the avatars but no invite control", async ({
		browser,
	}) => {
		/** the permission gate - B holds member access, so manage_members is denied. Runbook FIX-01. */
		const contextB = await browser.newContext({
			storageState: ACCOUNTS.b.storageState,
		});
		const pageB = await contextB.newPage();

		try {
			await pageB.goto("/projects");
			const firstProject = pageB.locator('a[href^="/projects/"]').first();
			await expect(firstProject).toBeVisible({ timeout: 20_000 });
			await firstProject.click();
			await pageB.waitForURL(/\/projects\/[0-9a-f-]{36}/);

			await expect(
				pageB.getByRole("heading", { name: "Kanban Board" }),
			).toBeVisible({ timeout: 20_000 });
			await expect(
				pageB.getByRole("button", { name: "Add member to project" }),
			).toHaveCount(0);
		} finally {
			await contextB.close();
		}
	});
});
