import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
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

// enforce authentication by requiring a user session
export const requireUser = cache(async () => {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/sign-in");
	}

	return user;
});
