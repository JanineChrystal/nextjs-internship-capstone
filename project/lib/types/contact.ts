import type { contactMessages } from "@/lib/db/schema";

/**
 * The database row shapes for contact messages.
 *
 * Derived from the table rather than hand-written, so adding a column cannot
 * leave this type quietly describing a row that no longer exists.
 */
export type DbContactMessage = typeof contactMessages.$inferSelect;
export type NewDbContactMessage = typeof contactMessages.$inferInsert;
