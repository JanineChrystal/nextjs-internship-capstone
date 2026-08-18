import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect, unauthorized } from "next/navigation";
import { cache } from "react";
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
 * The message actions return when there is no Clerk session behind the request.
 *
 * Kept distinct from "Unauthorized" because the two look identical to a user but
 * mean opposite things: one is "sign in again", the other is "you are not
 * allowed". Reporting an expired session as a permissions refusal sent us
 * hunting for a non-existent permissions bug when an owner's invite failed.
 */
export const SESSION_EXPIRED_ERROR =
	"Your session expired. Refresh the page and sign in again.";

/**
 * Whether the failure to resolve a user is a missing session or a missing row.
 *
 * Actions call this only on the failure path, so the happy path still costs one
 * cached lookup.
 */
export async function getSessionFailureReason(): Promise<string> {
	const { userId } = await auth();
	return userId ? "Unauthorized" : SESSION_EXPIRED_ERROR;
}

/**
 * Enforce authentication, distinguishing the two very different reasons
 * getCurrentUser can come back empty.
 *
 * No Clerk session at all sends the user to the public landing page, matching
 * what the middleware does at the edge so every path agrees on one destination.
 * This is now a backstop rather than the main guard - proxy.ts turns these
 * requests away before page code runs - but it is kept because the middleware is
 * routing while this is the data layer's own authority.
 *
 * A valid session with no matching row is genuinely unauthorized: the Clerk
 * webhook has not synced this user yet. Redirecting there would loop, so the 401
 * page is the right answer for that case.
 */
export const requireUser = cache(async () => {
	const { userId } = await auth();

	if (!userId) {
		redirect("/");
	}

	const user = await getCurrentUser();

	if (!user) {
		unauthorized();
	}

	return user;
});
