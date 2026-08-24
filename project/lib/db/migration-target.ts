import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

/**
 * Builds a drizzle-kit config aimed at one named Neon branch.
 *
 * ## Why every non-development branch gets its own variable
 *
 * Each environment in this project points at its own Neon branch, so
 * `pnpm db:migrate` only ever migrates development. The others have to be
 * migrated deliberately, and the target is named in the *variable*, not passed
 * on the command line.
 *
 * That matters more than it looks. Overriding `DATABASE_URL` for a single
 * command depends on shell syntax that differs between bash and PowerShell, and
 * when it silently fails to take effect, drizzle-kit falls back to `.env.local`
 * and reports "migrations applied successfully" - having migrated the wrong
 * database. A distinct variable name cannot be shadowed by that fallback.
 *
 * The alternative, one variable whose value you edit before each run, was what
 * this project did first. It works, but it means the production connection
 * string spends time sitting in the slot a routine command reads, and the
 * riskiest migration is the one you run right after editing that line.
 *
 * ## The two guards
 *
 * Both exist because the corresponding mistake has already happened once:
 * a mistyped shell override migrated the development branch while appearing to
 * succeed, and there was nothing in the output to notice.
 */
export function defineMigrationTarget(target: string, variableName: string) {
	const url = process.env[variableName];

	if (!url) {
		throw new Error(
			`${variableName} is missing. Add the ${target} branch's connection ` +
				"string to .env.local before running this migration.",
		);
	}

	if (url === process.env.DATABASE_URL) {
		throw new Error(
			`${variableName} is identical to DATABASE_URL, so this would migrate ` +
				`the development branch instead of ${target}. Check the connection string.`,
		);
	}

	// Printed so the target is visible BEFORE anything is applied - the one
	// question you actually want answered when running this is "which database
	// am I about to change?". Host only: a connection string carries a password,
	// and this line ends up in terminal scrollback and CI logs.
	console.info(`→ migrating ${target}: ${describeHost(url)}`);

	return defineConfig({
		out: "./drizzle",
		schema: "./lib/db/schema.ts",
		dialect: "postgresql",
		dbCredentials: { url },
		migrations: { schema: "public", table: "__drizzle_migrations" },
	});
}

/** The host and database of a connection string, with the credentials dropped. */
function describeHost(url: string): string {
	try {
		const parsed = new URL(url);
		return `${parsed.hostname}${parsed.pathname}`;
	} catch {
		// Not parseable as a URL. Say so rather than echoing a string that might
		// contain a password.
		return "(unrecognised connection string format)";
	}
}
