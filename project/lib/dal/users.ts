import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { normalizeInviteEmail } from "@/lib/dal/pending-invites";
import { db } from "@/lib/db";
import { users, workspaceMembers, workspaces } from "@/lib/db/schema";
import { toUserDTO, type UserOutputDTO } from "@/lib/dtos/user-dto";
import type { DbUser, NewDbUser, SessionUser } from "@/lib/types/user";

export async function upsertUserInDB(data: NewDbUser): Promise<UserOutputDTO> {
	try {
		return await db.transaction(async (tx) => {
			/**
			 * email collision priority - prioritizes email over clerkId for
			 * uniqueness resolution, ensuring users who delete and recreate
			 * Clerk accounts with the same email can still access their data.
			 */
			const [existingByEmail] = await tx
				.select()
				.from(users)
				.where(eq(users.email, data.email));

			let user: DbUser;

			if (existingByEmail && existingByEmail.clerkId !== data.clerkId) {
				/**
				 * repoint identity - updates the existing row with the new Clerk ID
				 * rather than replacing it, preventing the orphaning of existing
				 * foreign key references.
				 */
				const [reclaimed] = await tx
					.update(users)
					.set({
						clerkId: data.clerkId,
						firstName: data.firstName,
						lastName: data.lastName,
						imageUrl: data.imageUrl,
						/** resurrect account - clears the soft delete flag to seamlessly restore accounts upon a fresh signup. */
						deletedAt: null,
						updatedAt: new Date(),
					})
					.where(eq(users.id, existingByEmail.id))
					.returning();

				user = reclaimed;
			} else {
				const result = await tx
					.insert(users)
					.values({
						...data,
						email: data.email,
						firstName: data.firstName,
						lastName: data.lastName,
					})
					.onConflictDoUpdate({
						target: users.clerkId,
						set: {
							email: data.email,
							firstName: data.firstName,
							lastName: data.lastName,
							imageUrl: data.imageUrl,
							deletedAt: null,
							updatedAt: new Date(),
						},
					})
					.returning();

				user = result[0];
			}

			/** auto-create workspace - ensures every new user is provisioned with at least one default workspace. */
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
			/** filter active by clerk id - ensures only active users matching the specified clerk ID are soft-deleted. */
			.where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
			/** return updated row - verifies the soft deletion succeeded by returning the affected row. */
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

/**
 * find user ID by email - retrieves a user ID via a normalized email
 * lookup, returning null instead of throwing to naturally accommodate
 * unregistered invitees.
 */
export async function findUserIdByEmailDAL(
	email: string,
): Promise<string | null> {
	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			and(
				eq(users.email, normalizeInviteEmail(email)),
				isNull(users.deletedAt),
			),
		);

	return row?.id ?? null;
}

/**
 * sync clerk user - creates or updates a user row synchronously from
 * the Clerk session, eliminating the hard dependency on public webhooks
 * and reliably unblocking users who sign in when webhooks fail.
 */
export async function syncClerkUserToDbDAL(): Promise<SessionUser | null> {
	const clerkUser = await currentUser();
	if (!clerkUser) return null;

	/** select primary email - prefers the designated primary email, falling back to the first available for resilience. */
	const email =
		clerkUser.emailAddresses.find(
			(address) => address.id === clerkUser.primaryEmailAddressId,
		)?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

	/** require email - aborts sync if no email exists, as core app functions depend on an email address. */
	if (!email) return null;

	const synced = await upsertUserInDB({
		clerkId: clerkUser.id,
		email,
		firstName: clerkUser.firstName,
		lastName: clerkUser.lastName,
		imageUrl: clerkUser.imageUrl,
	});

	return {
		id: synced.id,
		clerkId: clerkUser.id,
		email: synced.email,
		firstName: synced.firstName,
		lastName: synced.lastName,
		imageUrl: synced.imageUrl,
	};
}
