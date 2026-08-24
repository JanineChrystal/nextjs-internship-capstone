import { defineMigrationTarget } from "./lib/db/migration-target";

/** Migrates the Neon `production` branch. See lib/db/migration-target.ts. */
export default defineMigrationTarget("production", "PRODUCTION_DATABASE_URL");
