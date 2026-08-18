import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import type { DbWorkspaceMember } from "@/lib/types/member";
import type { DbWorkspace } from "@/lib/types/workspace";

/**
 * Resolves the workspace a request should operate on, verifying the caller
 * actually belongs to it.
 *
 * The UI has no real workspace context and passes the literal string "default"
 * at every call site, so this centralises two things that were previously done
 * ad hoc and unsafely:
 *
 *   - "default"/omitted resolves to the caller's own workspace, deterministically
 *     ordered and excluding soft-deleted rows.
 *   - An explicit id is verified against ownership or active membership, instead
 *     of being trusted verbatim as it was in createTeamInDB.
 *
 * Throws "Workspace not found" rather than "Forbidden" for an id the caller
 * cannot access - a probe must not be able to confirm that another tenant's
 * workspace exists.
 */
export async function resolveActiveWorkspaceDAL(
	workspaceId?: string,
): Promise<DbWorkspace> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		if (workspaceId && workspaceId !== "default") {
			const [owned] = await db
				.select()
				.from(workspaces)
				.where(
					and(
						eq(workspaces.id, workspaceId),
						eq(workspaces.ownerId, user.id),
						isNull(workspaces.deletedAt),
					),
				);

			if (owned) return owned;

			const [joined] = await db
				.select({ workspace: workspaces })
				.from(workspaceMembers)
				.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
				.where(
					and(
						eq(workspaceMembers.workspaceId, workspaceId),
						eq(workspaceMembers.userId, user.id),
						eq(workspaceMembers.status, "active"),
						isNull(workspaceMembers.deletedAt),
						isNull(workspaces.deletedAt),
					),
				);

			if (joined) return joined.workspace;

			throw new Error("Workspace not found");
		}

		// Prefer a workspace the user owns. Ordering by createdAt keeps the choice
		// stable for users who own more than one - the previous code took [0] of an
		// unordered result, so the "default" workspace could change between calls.
		const [ownedDefault] = await db
			.select()
			.from(workspaces)
			.where(and(eq(workspaces.ownerId, user.id), isNull(workspaces.deletedAt)))
			.orderBy(asc(workspaces.createdAt))
			.limit(1);

		if (ownedDefault) return ownedDefault;

		// Users who own nothing but were invited elsewhere still need a workspace.
		const [joinedDefault] = await db
			.select({ workspace: workspaces })
			.from(workspaceMembers)
			.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
			.where(
				and(
					eq(workspaceMembers.userId, user.id),
					eq(workspaceMembers.status, "active"),
					isNull(workspaceMembers.deletedAt),
					isNull(workspaces.deletedAt),
				),
			)
			.orderBy(asc(workspaces.createdAt))
			.limit(1);

		if (joinedDefault) return joinedDefault.workspace;

		throw new Error("No active workspace found for user");
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === "Workspace not found" ||
				error.message === "No active workspace found for user")
		) {
			throw error;
		}
		throw new Error("Failed to resolve workspace", { cause: error });
	}
}

/**
 * The transaction handle Drizzle hands to a `db.transaction` callback.
 *
 * Derived from the client rather than imported from `drizzle-orm` internals so
 * it cannot drift from the actual driver, and required (rather than accepting
 * the plain client too) because every caller below already runs inside a
 * transaction - directory writes come in pairs and a half-applied pair is worse
 * than no write at all.
 */
export type WorkspaceTransaction = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

/**
 * Puts someone in a workspace's contact directory.
 *
 * Uses the resurrect pattern rather than onConflictDoNothing: the unique index
 * on (workspaceId, userId) survives a soft delete, so a previously removed
 * person would otherwise collide and silently stay removed.
 */
export async function addWorkspaceDirectoryMemberInDB(
	tx: WorkspaceTransaction,
	workspaceId: string,
	userId: string,
): Promise<DbWorkspaceMember> {
	const [membership] = await tx
		.insert(workspaceMembers)
		.values({ workspaceId, userId, status: "active" })
		.onConflictDoUpdate({
			target: [workspaceMembers.workspaceId, workspaceMembers.userId],
			set: { deletedAt: null, status: "active", updatedAt: new Date() },
		})
		.returning();

	return membership;
}

/**
 * The personal workspace of an arbitrary user.
 *
 * Deliberately not resolveActiveWorkspaceDAL: that one answers for the caller's
 * own session, and here we need the *other* party's workspace, on a code path
 * (the Clerk webhook) that has no session at all. Ordering by createdAt picks
 * the same workspace every time for anyone who owns more than one.
 */
async function getOwnedWorkspaceIdInDB(
	tx: WorkspaceTransaction,
	userId: string,
): Promise<string | null> {
	const [owned] = await tx
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(and(eq(workspaces.ownerId, userId), isNull(workspaces.deletedAt)))
		.orderBy(asc(workspaces.createdAt))
		.limit(1);

	return owned?.id ?? null;
}

/**
 * Makes a collaboration visible from both sides.
 *
 * Removal stays deliberately one-sided. Taking someone out of your own
 * directory is a personal decision and must not delete you from theirs, so this
 * has no counterpart on the removal path.
 */
export async function linkWorkspaceDirectoriesInDB(
	tx: WorkspaceTransaction,
	params: {
		inviterId: string;
		inviteeId: string;
		inviterWorkspaceId: string;
	},
): Promise<DbWorkspaceMember> {
	// Returned so callers that have to render the new member do not need a second
	// insert of their own just to get the row back.
	const membership = await addWorkspaceDirectoryMemberInDB(
		tx,
		params.inviterWorkspaceId,
		params.inviteeId,
	);

	// Inviting yourself is a no-op for the reciprocal half, and the guard also
	// keeps an owner from being listed as a member of their own workspace twice.
	if (params.inviterId === params.inviteeId) return membership;

	// No owned workspace means the invitee has not been through user creation
	// yet. Skipping is correct rather than an error: the invite is still
	// recorded, and the next path that runs for them will link the pair.
	const inviteeWorkspaceId = await getOwnedWorkspaceIdInDB(
		tx,
		params.inviteeId,
	);
	if (!inviteeWorkspaceId) return membership;

	await addWorkspaceDirectoryMemberInDB(
		tx,
		inviteeWorkspaceId,
		params.inviterId,
	);

	return membership;
}
