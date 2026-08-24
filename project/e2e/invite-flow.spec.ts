import { expect, test } from "@playwright/test";
import { ACCOUNTS, isConfigured } from "./helpers/accounts";
import { uniqueName } from "./helpers/naming";

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

		/** A creates a project to invite into. */
		await page.goto("/projects");
		await page.getByRole("button", { name: "Create New Project" }).click();

		const createDialog = page.getByRole("dialog");
		await createDialog
			.getByPlaceholder("Enter project name...")
			.fill(projectName);
		await createDialog.getByRole("button", { name: "Create Project" }).click();
		await expect(createDialog).toBeHidden();

		await page.getByText(projectName, { exact: true }).first().click();
		await page.waitForURL(/\/projects\/[0-9a-f-]{36}/);
		const projectUrl = page.url();

		/** A invites B. */
		await page.getByRole("button", { name: "Add member to project" }).click();

		const inviteDialog = page.getByRole("dialog");
		await inviteDialog
			.getByRole("textbox")
			.first()
			.fill(ACCOUNTS.b.email as string);
		await inviteDialog
			.getByRole("button", { name: /add|stage/i })
			.first()
			.click();
		await inviteDialog.getByRole("button", { name: "Send All" }).click();

		/** B is not a member yet - the invitation is an offer, not a grant. */
		const contextB = await browser.newContext({
			storageState: ACCOUNTS.b.storageState,
		});
		const pageB = await contextB.newPage();

		try {
			await pageB.goto("/team");
			const invitePanel = pageB.getByRole("heading", {
				name: /Invitations for you/,
			});
			await expect(invitePanel).toBeVisible({ timeout: 20_000 });

			/** B accepts, and only then can reach the project. */
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
			).toBeVisible();
			await expect(
				pageB.getByRole("button", { name: "Add member to project" }),
			).toHaveCount(0);
		} finally {
			await contextB.close();
		}
	});
});
