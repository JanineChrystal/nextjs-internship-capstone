import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAppBaseUrl } from "@/lib/utils/app-url";

// Save originals so each test starts clean
const originalEnv = { ...process.env };

afterEach(() => {
	for (const key of [
		"APP_URL",
		"VERCEL_ENV",
		"VERCEL_PROJECT_PRODUCTION_URL",
		"VERCEL_BRANCH_URL",
		"VERCEL_URL",
	]) {
		delete process.env[key];
	}
	Object.assign(process.env, originalEnv);
});

describe("getAppBaseUrl", () => {
	beforeEach(() => {
		delete process.env.APP_URL;
		delete process.env.VERCEL_ENV;
		delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
		delete process.env.VERCEL_BRANCH_URL;
		delete process.env.VERCEL_URL;
	});

	it("returns APP_URL when set, adding https if missing", () => {
		process.env.APP_URL = "myapp.com";
		expect(getAppBaseUrl()).toBe("https://myapp.com");
	});

	it("preserves an existing https:// scheme in APP_URL", () => {
		process.env.APP_URL = "https://myapp.com";
		expect(getAppBaseUrl()).toBe("https://myapp.com");
	});

	it("preserves an existing http:// scheme in APP_URL", () => {
		process.env.APP_URL = "http://localhost:3000";
		expect(getAppBaseUrl()).toBe("http://localhost:3000");
	});

	it("strips a trailing slash from APP_URL", () => {
		process.env.APP_URL = "https://myapp.com/";
		expect(getAppBaseUrl()).toBe("https://myapp.com");
	});

	it("uses VERCEL_PROJECT_PRODUCTION_URL only on production env", () => {
		process.env.VERCEL_ENV = "production";
		process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.vercel.app";
		expect(getAppBaseUrl()).toBe("https://myapp.vercel.app");
	});

	it("ignores VERCEL_PROJECT_PRODUCTION_URL on preview env", () => {
		process.env.VERCEL_ENV = "preview";
		process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.vercel.app";
		process.env.VERCEL_BRANCH_URL = "branch.vercel.app";
		expect(getAppBaseUrl()).toBe("https://branch.vercel.app");
	});

	it("falls back to VERCEL_BRANCH_URL when no production url", () => {
		process.env.VERCEL_BRANCH_URL = "branch.vercel.app";
		expect(getAppBaseUrl()).toBe("https://branch.vercel.app");
	});

	it("falls back to VERCEL_URL as the last Vercel option", () => {
		process.env.VERCEL_URL = "deploy-xyz.vercel.app";
		expect(getAppBaseUrl()).toBe("https://deploy-xyz.vercel.app");
	});

	it("falls back to http://localhost:3000 when nothing is set", () => {
		expect(getAppBaseUrl()).toBe("http://localhost:3000");
	});
});
