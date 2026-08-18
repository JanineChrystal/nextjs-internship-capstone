import type { pendingInvites } from "@/lib/db/schema";

export type DbPendingInvite = typeof pendingInvites.$inferSelect;
export type NewDbPendingInvite = typeof pendingInvites.$inferInsert;

/**
 * What an invite call reports back.
 *
 * "invited" means the person already had an account and now holds real
 * membership rows; "pending" means the invitation was stored and will be
 * claimed when they sign up. The caller needs to tell the user which happened.
 */
export type InviteOutcome = "invited" | "pending";
