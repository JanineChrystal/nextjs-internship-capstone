import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

/** env loading - Playwright does not read .env.local the way Next does, and the sign-in credentials live there. */
loadEnv({ path: ".env.local", quiet: true });

/** target - unset runs against a local `next start`; set runs against a deployment and starts no server. */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const isRemote = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
	testDir: "./e2e",
	/** single worker - the specs share one account and create real rows, so parallel runs make failures order-dependent. */
	workers: 1,
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 1,
	reporter: [["list"], ["html", { open: "never" }]],

	timeout: 60_000,
	expect: { timeout: 15_000 },

	use: {
		baseURL,
		/** failure artefacts - a passing run leaves nothing behind. */
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	projects: [
		/** setup - signs in once and writes the storage state the rest reuse. */
		{ name: "setup", testMatch: /auth\.setup\.ts/ },

		{
			name: "chromium",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				storageState: "e2e/.auth/user.json",
			},
		},

		/** mobile - a real device profile, since a narrow desktop window still reports pointer:fine and takes the mouse path. */
		{
			name: "mobile",
			dependencies: ["setup"],
			use: {
				...devices["Pixel 7"],
				storageState: "e2e/.auth/user.json",
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
