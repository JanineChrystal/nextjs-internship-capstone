import type { contactMessages } from "@/lib/db/schema";

/**
 * database contact message - defines the inferred database row shapes for
 * contact messages, tying the type directly to the schema to prevent drift.
 */
export type DbContactMessage = typeof contactMessages.$inferSelect;
export type NewDbContactMessage = typeof contactMessages.$inferInsert;
