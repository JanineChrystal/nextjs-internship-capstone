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

	return user || null;
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

	const user = await getCurrentUser();
	if (user) return user;

	/**
	 * sync delayed webhook - creates the user row directly from the session
	 * if the clerk webhook was delayed or blocked, preventing a dead-end 401.
	 */
	const synced = await syncClerkUserToDbDAL();
	if (synced) return synced;

	/** handle broken state - triggers 401 if clerk cannot describe the session, indicating a genuinely broken state. */
	unauthorized();
});
