import { defineMigrationTarget } from "./lib/db/migration-target";

/** Migrates the Neon `integration` branch. See lib/db/migration-target.ts. */
export default defineMigrationTarget("integration", "INTEGRATION_DATABASE_URL");
