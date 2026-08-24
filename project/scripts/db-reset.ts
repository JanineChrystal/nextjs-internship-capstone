import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

/** app tables - every table drizzle manages, excluding __drizzle_migrations so the ledger survives and no re-migration is needed. */
const APP_TABLES = [
	"ActivityLogs",
	"Attachments",
	"Boards",
	"Categories",
	"Checklists",
	"CommentMentions",
	"Comments",
	"ContactMessages",
	"Notifications",
	"NotificationSettings",
	"PendingInvites",
	"ProjectInvites",
	"ProjectMembers",
	"ProjectTeams",
	"Projects",
	"TaskAssignees",
	"Tasks",
	"TeamMembers",
	"Teams",
	"Users",
	"WorkspaceMembers",
	"Workspaces",
];

/** host label - shows which branch is about to be emptied without printing the credential. */
function describeHost(url: string): string {
	try {
		return new URL(url).host;
	} catch {
		return "an unparseable URL";
	}
}

async function main(): Promise<void> {
	const variableName = process.argv[2];
	const confirmed = process.argv.includes("--yes");

	if (!variableName) {
		throw new Error(
			"Usage: tsx scripts/db-reset.ts <ENV_VAR_NAME> --yes\n" +
				"Example: tsx scripts/db-reset.ts INTEGRATION_DATABASE_URL --yes",
		);
	}

	const url = process.env[variableName];
	if (!url) {
		throw new Error(`${variableName} is missing from .env.local.`);
	}

	/** identical-url guard - the copy-paste that would silently empty the development branch instead. */
	if (url === process.env.DATABASE_URL) {
		throw new Error(
			`${variableName} is identical to DATABASE_URL. Refusing to wipe the branch you develop against.`,
		);
	}

	console.info(`Target: ${describeHost(url)} (from ${variableName})`);

	if (!confirmed) {
		console.info(
			"\nThis DELETES EVERY ROW in that database. Re-run with --yes to proceed.",
		);
		return;
	}

	const pool = new Pool({ connectionString: url });

	try {
		/** one statement - TRUNCATE across all tables at once so foreign keys never see a half-empty database. */
		const list = APP_TABLES.map((name) => `"${name}"`).join(", ");
		await pool.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);

		console.info(`\nEmptied ${APP_TABLES.length} tables. Schema is unchanged.`);
		console.info(
			"Next: sign in to the deployed app to recreate your user, then seed.",
		);
	} finally {
		await pool.end();
	}
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
