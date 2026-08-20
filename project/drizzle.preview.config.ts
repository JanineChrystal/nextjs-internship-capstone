import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

/**
 * Migration config for a database branch other than the local development one.
 *
 * Each environment in this project points at its own Neon branch, so running
 * `pnpm db:migrate` locally only ever migrates the development branch. The
 * preview and production branches have to be migrated deliberately, and this
 * config is how that is done.
 *
 * It reads a DIFFERENT variable name rather than overriding DATABASE_URL. That
 * is the whole point: setting DATABASE_URL for one command depends on shell
 * syntax that differs between PowerShell and bash, and getting it wrong fails
 * silently - drizzle-kit falls back to .env.local and reports "migrations
 * applied successfully" after migrating the wrong database. A separate name
 * cannot be shadowed by that fallback.
 */
const previewUrl = process.env.PREVIEW_DATABASE_URL;

if (!previewUrl) {
	throw new Error(
		"PREVIEW_DATABASE_URL is missing. Add the target branch's connection " +
			"string to .env.local before running this migration.",
	);
}

// The failure this guards against has already happened once: a mistyped shell
// override migrated the development branch while appearing to succeed. If the
// two URLs match, the target was never actually changed.
if (previewUrl === process.env.DATABASE_URL) {
	throw new Error(
		"PREVIEW_DATABASE_URL is identical to DATABASE_URL, so this would " +
			"migrate the development branch. Check the connection string.",
	);
}

export default defineConfig({
	out: "./drizzle",
	schema: "./lib/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: { url: previewUrl },
	migrations: { schema: "public", table: "__drizzle_migrations" },
});
