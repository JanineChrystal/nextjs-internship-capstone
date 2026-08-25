import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect, unauthorized } from "next/navigation";
import { cache } from "react";
import { syncClerkUserToDbDAL } from "@/lib/dal/users";
import { db } from "../db/index";
import { users } from "../db/schema";

export const getCurrentUser = cache(async () => {
	// get the active session user id from clerk
	const { userId } = await auth();

	// return null if no one is logged in
	if (!userId) {
		return null;
	}

	// query neon database and select only the specific fields needed
	const [user] = await db
		.select({
			id: users.id,
			clerkId: users.clerkId,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			imageUrl: users.imageUrl,
		})
		.from(users)
		.where(eq(users.clerkId, userId));

	if (user) return user;

	/**
	 * sync here, not only in requireUser - this function is wrapped in `cache`,
	 * so returning null on a first miss memoises that null for the whole request.
	 * A page that calls requireUser (which syncs) and then any DAL would have the
	 * DAL read the cached null and throw, which is the 403 a brand new account
	 * saw on its very first dashboard render and never again.
	 */
	return (await syncClerkUserToDbDAL()) ?? null;
});

/**
 * session expired error message - provides a distinct message for missing
 * clerk sessions to differentiate expired logins from explicit permission
 * denials, aiding debugging.
 */
export const SESSION_EXPIRED_ERROR =
	"Your session expired. Refresh the page and sign in again.";

/**
 * get session failure reason - determines whether a missing user is due
 * to an expired session or unauthorized access, caching the happy path.
 */
export async function getSessionFailureReason(): Promise<string> {
	const { userId } = await auth();
	return userId ? "Unauthorized" : SESSION_EXPIRED_ERROR;
}

/**
 * require user - enforces authentication by differentiating between missing
 * clerk sessions (redirecting to public landing) and missing database rows
 * despite a valid session (triggering a sync before ultimately 401ing if
 * completely broken).
 */
export const requireUser = cache(async () => {
	const { userId } = await auth();

	if (!userId) {
		redirect("/");
	}

	/** getCurrentUser already syncs a missing row, so a null here means Clerk cannot describe the session at all. */
	const user = await getCurrentUser();
	if (user) return user;

	/** handle broken state - triggers 401 if clerk cannot describe the session, indicating a genuinely broken state. */
	unauthorized();
});
