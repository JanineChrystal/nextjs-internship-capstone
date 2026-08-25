import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

/** the prefix - every name the Playwright suite invents starts with it, so nothing a person made is ever matched. */
const E2E_PREFIX = "E2E %";

export interface CleanupResult {
	tasks: number;
	projects: number;
}

/** host label - shows which branch is about to be touched without printing the credential. */
function describeHost(url: string): string {
	try {
		return new URL(url).host;
	} catch {
		return "an unparseable URL";
	}
}

/**
 * remove the suite's leftovers - deleting a project cascades to its boards,
 * tasks, members, activity and invites, so only stray tasks created inside
 * someone else's project need removing separately.
 */
export async function cleanupE2EData(
	connectionString: string,
	{ dryRun }: { dryRun: boolean },
): Promise<CleanupResult> {
	const pool = new Pool({ connectionString });

	try {
		if (dryRun) {
			const [tasks, projects] = await Promise.all([
				pool.query(
					`SELECT count(*)::int AS n FROM "Tasks" WHERE name LIKE $1`,
					[E2E_PREFIX],
				),
				pool.query(
					`SELECT count(*)::int AS n FROM "Projects" WHERE name LIKE $1`,
					[E2E_PREFIX],
				),
			]);
			return { tasks: tasks.rows[0].n, projects: projects.rows[0].n };
		}

		/** tasks first - one created from the dashboard shortcut can live in a project the suite did not make, so no cascade would reach it. */
		const tasks = await pool.query(
			`DELETE FROM "Tasks" WHERE name LIKE $1 RETURNING id`,
			[E2E_PREFIX],
		);
		const projects = await pool.query(
			`DELETE FROM "Projects" WHERE name LIKE $1 RETURNING id`,
			[E2E_PREFIX],
		);

		return { tasks: tasks.rowCount ?? 0, projects: projects.rowCount ?? 0 };
	} finally {
		await pool.end();
	}
}

async function main(): Promise<void> {
	const variableName = process.argv[2] ?? "DATABASE_URL";
	const confirmed = process.argv.includes("--yes");

	const url = process.env[variableName];
	if (!url) {
		throw new Error(`${variableName} is missing from .env.local.`);
	}

	console.info(`Target: ${describeHost(url)} (from ${variableName})`);

	const counts = await cleanupE2EData(url, { dryRun: !confirmed });

	if (!confirmed) {
		console.info(
			`\nWould delete ${counts.projects} projects and ${counts.tasks} stray tasks named "E2E ...".` +
				"\nRe-run with --yes to proceed.",
		);
		return;
	}

	console.info(
		`\nDeleted ${counts.projects} projects and ${counts.tasks} stray tasks.`,
	);
}

/** direct run only - the Playwright teardown imports the function and must not trigger the CLI. */
if (process.argv[1]?.includes("e2e-cleanup")) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
