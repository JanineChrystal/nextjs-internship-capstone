import { eq } from "drizzle-orm";
import type { NewDbUser } from "@/types/user";
import { db } from "../index";
import { users } from "../schema";

// insert a newly signed up clerk user into the database
export const createUser = async (data: NewDbUser) => {
	return await db.insert(users).values(data).returning();
};

// update existing user data based on clerk id lookup
export const updateUserByClerkId = async (
	clerkId: string,
	data: Partial<NewDbUser>,
) => {
	return await db
		.update(users)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(users.clerkId, clerkId))
		.returning();
};

// soft delete user by setting deletedAt timestamp
export const softDeleteUserByClerkId = async (clerkId: string) => {
	return await db
		.update(users)
		.set({ deletedAt: new Date() })
		.where(eq(users.clerkId, clerkId))
		.returning();
};
