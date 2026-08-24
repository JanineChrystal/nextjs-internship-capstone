import type { pendingInvites } from "@/lib/db/schema";

export type DbPendingInvite = typeof pendingInvites.$inferSelect;
export type NewDbPendingInvite = typeof pendingInvites.$inferInsert;

/**
 * invite outcome - categorizes the result of an invite request, distinguishing
 * between direct membership grants ('invited') and deferred storage ('pending').
 */
export type InviteOutcome = "invited" | "pending";
