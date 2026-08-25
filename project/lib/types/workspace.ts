import type { workspaces } from "@/lib/db/schema";

// 1. DATABASE SCHEMA TYPES (Inferred automatically from Drizzle)
export type DbWorkspace = typeof workspaces.$inferSelect;
export type NewDbWorkspace = typeof workspaces.$inferInsert;
