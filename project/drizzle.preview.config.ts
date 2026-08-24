import { defineMigrationTarget } from "./lib/db/migration-target";

/**
 * Migrates the Neon `preview` branch.
 *
 * Kept alongside the integration and production configs rather than folded into
 * them: Vercel's Preview environment is its own branch, and giving it its own
 * variable means a preview migration can never be one mistyped value away from
 * production.
 */
export default defineMigrationTarget("preview", "PREVIEW_DATABASE_URL");
