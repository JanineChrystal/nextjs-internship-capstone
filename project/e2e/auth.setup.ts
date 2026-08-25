import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, type Page, test as setup } from "@playwright/test";
import { ACCOUNTS, type Account, isConfigured } from "./helpers/accounts";

/** clerk test code - the fixed code a development instance accepts for any +clerk_test address, so no real inbox is involved. */
const CLERK_TEST_CODE = "424242";

/**
 * device verification - Clerk emails a code when it sees a new device, and a
 * fresh browser is always a new device. Only +clerk_test addresses can clear it
 * without an inbox, so a real address fails here with an explanation.
 */
async function clearDeviceVerification(
	page: Page,
	account: Account,
): Promise<void> {
	const codeField = page.getByRole("textbox", {
		name: /verification code/i,
	});

	/** short wait - the screen either appears straight away or not at all. */
	const appeared = await codeField
		.waitFor({ state: "visible", timeout: 5_000 })
		.then(() => true)
		.catch(() => false);

	if (!appeared) return;

	if (!account.email?.includes("+clerk_test")) {
		throw new Error(
			`Clerk asked ${account.email} to verify a new device, which needs a code from a real inbox.\n` +
				"Use a +clerk_test address instead - a development instance accepts 424242 for those.\n" +
				"See .env.example for the details.",
		);
	}

	await codeField.fill(CLERK_TEST_CODE);
}

/** sign in - drives the real form; the testing token marks the run as a known test rather than turning Clerk's bot protection off. */
async function signIn(page: Page, account: Account): Promise<void> {
	await setupClerkTestingToken({ page });

	await page.goto("/sign-in");

	await page.getByLabel(/email/i).fill(account.email as string);
	await page.getByRole("button", { name: "Continue", exact: true }).click();

	/** by placeholder - Clerk labels the field and its "Show password" toggle the same way, so a label match hits both. */
	await page
		.getByPlaceholder("Enter your password")
		.fill(account.password as string);
	await page.getByRole("button", { name: "Continue", exact: true }).click();

	await clearDeviceVerification(page, account);

	/** wait on content, not the URL - Clerk redirects through an interstitial, so the address bar arrives first. */
	await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
	await expect(
		page.getByRole("heading", { name: "Quick Actions" }),
	).toBeVisible();

	await page.context().storageState({ path: account.storageState });
	writeFileSync(
		metaPath(account),
		JSON.stringify({ origin: new URL(page.url()).origin, savedAt: Date.now() }),
	);
}

/** sidecar - records which host the cookies belong to, since a localhost session is no use against a deployed one. */
function metaPath(account: Account): string {
	return account.storageState.replace(/\.json$/, ".meta.json");
}

/**
 * reuse window - Clerk's development instance rate-limits hard, and a full
 * suite run costs three sign-ins. Eight hours stays well inside the app's own
 * 24-hour session cap, so a reused session is a real one, never an expired one.
 */
const REUSE_WINDOW_MS = 8 * 60 * 60 * 1000;

function hasFreshSession(account: Account, baseURL: string): boolean {
	if (process.env.E2E_FORCE_SIGN_IN === "true") return false;
	if (!existsSync(account.storageState) || !existsSync(metaPath(account))) {
		return false;
	}

	try {
		const meta = JSON.parse(readFileSync(metaPath(account), "utf8"));
		const sameHost = meta.origin === new URL(baseURL).origin;
		return sameHost && Date.now() - meta.savedAt < REUSE_WINDOW_MS;
	} catch {
		return false;
	}
}

for (const account of Object.values(ACCOUNTS)) {
	setup(
		`authenticate ${account.key} (${account.role})`,
		async ({ page, baseURL }) => {
			/** A is required, B and C are not - the multi-user specs skip themselves when a login is missing, so the suite still runs with one account. */
			if (!isConfigured(account)) {
				if (account.key === "a") {
					throw new Error(
						"E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.local",
					);
				}
				setup.skip(true, `no credentials for account ${account.key}`);
				return;
			}

			if (hasFreshSession(account, baseURL ?? "")) {
				setup.skip(
					true,
					`reusing the saved session for account ${account.key}`,
				);
				return;
			}

			await clerkSetup();
			await signIn(page, account);
		},
	);
}
