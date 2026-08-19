import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { normalizeInviteEmail } from "@/lib/dal/pending-invites";
import { db } from "@/lib/db";
import { users, workspaceMembers, workspaces } from "@/lib/db/schema";
import { toUserDTO, type UserOutputDTO } from "@/lib/dtos/user-dto";
import { encrypt, deterministicEncrypt } from "@/lib/utils/encryption";
import type { DbUser, NewDbUser, SessionUser } from "@/lib/types/user";

export async function upsertUserInDB(data: NewDbUser): Promise<UserOutputDTO> {
	try {
		return await db.transaction(async (tx) => {
			// Users has TWO unique columns - clerkId and email - so an insert can
			// collide on either, and onConflictDoUpdate can only name one of them.
			// The email collision is the case that matters: deleting a Clerk account
			// and signing up again with the same address issues a NEW clerkId while
			// the old row still holds that email, so a clerkId-only upsert throws a
			// unique violation and the person can never get back in.
			const encryptedEmail = deterministicEncrypt(data.email) || data.email;
			const [existingByEmail] = await tx
				.select()
				.from(users)
				.where(eq(users.email, encryptedEmail));

			let user: DbUser;

			if (existingByEmail && existingByEmail.clerkId !== data.clerkId) {
				// Same person, new Clerk identity. The row is re-pointed rather than
				// replaced: projects, memberships and comments all reference Users.id,
				// so creating a second row would orphan everything they had.
				const [reclaimed] = await tx
					.update(users)
					.set({
						clerkId: data.clerkId,
						firstName: encrypt(data.firstName) || data.firstName,
						lastName: encrypt(data.lastName) || data.lastName,
						imageUrl: data.imageUrl,
						// Clears a soft delete, so a user.deleted webhook followed by a
						// fresh signup restores the account instead of leaving it hidden.
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
						email: encryptedEmail,
						firstName: encrypt(data.firstName) || data.firstName,
						lastName: encrypt(data.lastName) || data.lastName,
					})
					.onConflictDoUpdate({
						target: users.clerkId,
						set: {
							email: encryptedEmail,
							firstName: encrypt(data.firstName) || data.firstName,
							lastName: encrypt(data.lastName) || data.lastName,
							imageUrl: data.imageUrl,
							deletedAt: null,
							updatedAt: new Date(),
						},
					})
					.returning();

				user = result[0];
			}

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

/**
 * The user id behind an email address, or null when nobody has that address.
 *
 * Used when an activity entry needs to name the person an action was about but
 * the caller only has their email - inviting by address, for instance. Returns
 * null rather than throwing because "no account yet" is an ordinary outcome
 * here, not an error: a pending invite is exactly that case.
 *
 * Normalises the address the same way invites do, so a lookup cannot miss on
 * capitalisation alone.
 */
export async function findUserIdByEmailDAL(
	email: string,
): Promise<string | null> {
	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			and(
				eq(users.email, deterministicEncrypt(normalizeInviteEmail(email)) || email),
				isNull(users.deletedAt),
			),
		);

	return row?.id ?? null;
}

/**
 * Creates this session's Users row directly from Clerk, without a webhook.
 *
 * The Clerk webhook is normally what creates a user, but it is delivered over
 * the public internet and can simply not arrive - a tunnel that is down in
 * development, or a deployment sitting behind an auth wall that answers 401
 * before the request reaches the app. When that happens the person signs in
 * successfully at Clerk and then has no row here, which used to leave them
 * permanently stuck on the "Account not ready yet" page with no way forward:
 * nothing in the app besides the webhook ever created that row, so refreshing
 * could not help.
 *
 * This closes that hole. The session itself already proves who they are, and
 * currentUser() reads their profile straight from Clerk, so a missing row can
 * be filled in on the spot. Webhook delivery becomes a speed optimisation
 * rather than a hard dependency.
 *
 * Safe to call repeatedly: upsertUserInDB is a conflict-safe upsert keyed on
 * clerkId, and it only creates a workspace when the user has none.
 */
export async function syncClerkUserToDbDAL(): Promise<SessionUser | null> {
	const clerkUser = await currentUser();
	if (!clerkUser) return null;

	// Prefer the address Clerk marks primary; fall back to the first one so a
	// user with an unusual address setup is still recoverable.
	const email =
		clerkUser.emailAddresses.find(
			(address) => address.id === clerkUser.primaryEmailAddressId,
		)?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

	// No address means nothing to key invites or membership on, so this is not
	// a recoverable state - the caller should still refuse the request.
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
