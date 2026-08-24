import path from "node:path";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(__dirname, ".auth/user.json");

/** auth setup - signs in once and saves the session, so the other specs are about their own features rather than about Clerk being slow. */
setup("authenticate", async ({ page }) => {
	const email = process.env.E2E_USER_EMAIL;
	const password = process.env.E2E_USER_PASSWORD;

	if (!email || !password) {
		throw new Error(
			"E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.local",
		);
	}

	/** testing token - marks the run as a known test so Clerk's bot detection does not block it, rather than turning the protection off. */
	await clerkSetup();
	await setupClerkTestingToken({ page });

	await page.goto("/sign-in");

	await page.getByLabel(/email/i).fill(email);
	await page.getByRole("button", { name: /continue/i }).click();

	await page.getByLabel(/password/i).fill(password);
	await page.getByRole("button", { name: /continue/i }).click();

	/** wait on content, not the URL - Clerk redirects through an interstitial, so the address bar arrives first. */
	await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
	await expect(
		page.getByRole("heading", { name: "Quick Actions" }),
	).toBeVisible();

	await page.context().storageState({ path: authFile });
});
