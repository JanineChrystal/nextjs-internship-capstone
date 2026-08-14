import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, workspaceMembers, workspaces } from "@/lib/db/schema";
import { toUserDTO, type UserOutputDTO } from "@/lib/dtos/user-dto";
import type { NewDbUser } from "@/lib/types/user";

export async function upsertUserInDB(data: NewDbUser): Promise<UserOutputDTO> {
	try {
		return await db.transaction(async (tx) => {
			const result = await tx
				.insert(users)
				.values(data)
				.onConflictDoUpdate({
					target: users.clerkId,
					set: {
						email: data.email,
						firstName: data.firstName,
						lastName: data.lastName,
						imageUrl: data.imageUrl,
						updatedAt: new Date(),
					},
				})
				.returning();

			const user = result[0];

			// Hook A: Workspace Auto-Creation
			// Ensure the user has at least one workspace
			const existingWorkspaces = await tx
				.select()
				.from(workspaces)
				.where(
					and(eq(workspaces.ownerId, user.id), isNull(workspaces.deletedAt)),
				);

			if (existingWorkspaces.length === 0) {
				const workspaceName = data.firstName
					? `${data.firstName}'s Workspace`
					: "My Workspace";

				const [newWorkspace] = await tx
					.insert(workspaces)
					.values({
						ownerId: user.id,
						name: workspaceName,
					})
					.returning();

				await tx.insert(workspaceMembers).values({
					workspaceId: newWorkspace.id,
					userId: user.id,
					status: "active",
				});
			}

			return toUserDTO(user);
		});
	} catch (error) {
		throw new Error("Failed to sync user to database", { cause: error });
	}
}

export async function deleteUserFromDB(
	clerkId: string,
): Promise<UserOutputDTO> {
	try {
		const updatedUsers = await db
			.update(users)
			.set({ deletedAt: new Date() })
			// ensure the user matches the clerk id and is not already deleted
			.where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
			// return the updated row to verify it worked
			.returning();

		if (updatedUsers.length === 0) {
			throw new Error("User already deleted or user does not exist");
		}

		return toUserDTO(updatedUsers[0]);
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "User already deleted or user does not exist"
		) {
			throw error;
		}
		throw new Error("Failed to soft delete user from database");
	}
}
