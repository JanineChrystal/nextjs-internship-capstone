import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

/** env loading - Playwright does not read .env.local the way Next does, and the sign-in credentials live there. */
loadEnv({ path: ".env.local", quiet: true });

/**
 * target - chosen by E2E_TARGET, not by whether E2E_BASE_URL happens to be set,
 * so switching between local and deployed never means editing .env.local.
 */
const isRemote = process.env.E2E_TARGET === "deployed";
const baseURL = isRemote
	? (process.env.E2E_BASE_URL ?? "")
	: "http://localhost:3000";

if (isRemote && !baseURL) {
	throw new Error("E2E_TARGET=deployed needs E2E_BASE_URL set in .env.local");
}

/** protection bypass - Vercel puts its own SSO in front of protected deployments, which an automated browser cannot pass; this header is the supported way through. */
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
	testDir: "./e2e",
	/** single worker - the specs share accounts and create real rows, so parallel runs make failures order-dependent. */
	workers: 1,
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 1,
	reporter: [["list"], ["html", { open: "never" }]],

	/** 90s - a CRUD spec creates its own project first, and the projects list grows slower with every run's leftovers. */
	timeout: 90_000,
	expect: { timeout: 15_000 },

	use: {
		baseURL,
		...(bypassSecret
			? {
					extraHTTPHeaders: {
						"x-vercel-protection-bypass": bypassSecret,
						"x-vercel-set-bypass-cookie": "true",
					},
				}
			: {}),
		/** failure artefacts - a passing run leaves nothing behind. */
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	projects: [
		/** setup - signs each configured account in and writes the storage state the rest reuse. */
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
			teardown: "cleanup",
		},

		/** cleanup - runs once everything depending on setup has finished, so the next run starts from the data it inherited rather than today's leftovers. */
		{ name: "cleanup", testMatch: /global\.teardown\.ts/ },

		{
			name: "chromium",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				storageState: "e2e/.auth/user-a.json",
			},
		},

		/** mobile - a real device profile, since a narrow desktop window still reports pointer:fine and takes the mouse path. */
		{
			name: "mobile",
			dependencies: ["setup"],
			use: {
				...devices["Pixel 7"],
				storageState: "e2e/.auth/user-a.json",
			},
		},
	],

	/** local server - `next start` not `next dev`, which compiles each route on first visit and times out cold. */
	webServer: isRemote
		? undefined
		: {
				command: "pnpm start",
				url: "http://localhost:3000",
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			},
});
