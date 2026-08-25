import { test as teardown } from "@playwright/test";
import { cleanupE2EData } from "../scripts/e2e-cleanup";

/**
 * teardown - every project the suite creates is named "E2E ...", and nothing
 * deleted them. Left alone they accumulate until /projects renders hundreds of
 * cards and the helpers time out waiting for it, which is a suite that poisons
 * itself over a few runs.
 */
teardown("remove the data this run created", async () => {
	if (process.env.E2E_SKIP_CLEANUP === "true") {
		teardown.skip(true, "E2E_SKIP_CLEANUP is set");
		return;
	}

	/** local only - a deployed run reads its database from Vercel, which this process has no URL for. */
	if (process.env.E2E_TARGET === "deployed") {
		teardown.skip(true, "cleanup only runs against the local database");
		return;
	}

	const url = process.env.DATABASE_URL;
	if (!url) {
		teardown.skip(true, "DATABASE_URL is not set");
		return;
	}

	const counts = await cleanupE2EData(url, { dryRun: false });
	console.info(
		`Cleanup: removed ${counts.projects} projects and ${counts.tasks} stray tasks.`,
	);
});
