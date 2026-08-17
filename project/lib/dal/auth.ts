import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { unauthorized } from "next/navigation";
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
 * Enforce authentication, distinguishing the two very different reasons
 * getCurrentUser can come back empty.
 *
 * No Clerk session at all is usually a token that could not be refreshed, which
 * happens on soft navigation because the dashboard layout's own redirect only
 * runs on a full page load. That is recoverable, so send the user through sign-in
 * and back to where they were - the previous behaviour showed a dead-end 401 page
 * on /projects and /team, the only two routes that call this.
 *
 * A valid session with no matching row is genuinely unauthorized: the Clerk
 * webhook has not synced this user yet. Redirecting there would loop, so the 401
 * page is the right answer for that case.
 */
export const requireUser = cache(async () => {
	const { userId, redirectToSignIn } = await auth();

	if (!userId) {
		// Clerk's own helper rather than a hand-built URL: it knows the configured
		// sign-in route and carries the return-back URL for us.
		redirectToSignIn();
	}

	const user = await getCurrentUser();

	if (!user) {
		unauthorized();
	}

	return user;
});
