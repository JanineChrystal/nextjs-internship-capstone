import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import type { DbWorkspaceMember } from "@/lib/types/member";
import type { DbWorkspace } from "@/lib/types/workspace";

/**
 * resolve active workspace - centrally resolves 'default' requests to a
 * user's owned workspace and securely verifies explicit IDs against
 * ownership or active membership, throwing 'not found' on denial to
 * prevent enumeration attacks.
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

		/**
		 * default to oldest owned - prioritizes owned workspaces and orders
		 * by creation date to guarantee a stable 'default' selection across
		 * repeated requests.
		 */
		const [ownedDefault] = await db
			.select()
			.from(workspaces)
			.where(and(eq(workspaces.ownerId, user.id), isNull(workspaces.deletedAt)))
			.orderBy(asc(workspaces.createdAt))
			.limit(1);

		if (ownedDefault) return ownedDefault;

		/** fallback to oldest joined - provides a fallback workspace for users who only possess joined memberships. */
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
 * WorkspaceTransaction - extracts the specific transaction handle type
 * from Drizzle to enforce that cross-directory writes always execute
 * within an existing transaction context.
 */
export type WorkspaceTransaction = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

/**
 * add workspace directory member - provisions a directory membership using
 * an upsert/resurrect pattern to correctly restore previously soft-deleted
 * members.
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
 * get owned workspace id - retrieves the oldest owned workspace for an
 * arbitrary user ID, designed specifically for sessionless contexts like
 * webhooks where resolveActiveWorkspaceDAL cannot be used.
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
 * link workspace directories - executes a reciprocal addition to establish
 * two-way directory visibility, intentionally lacking a removal counterpart
 * since removals remain strictly personal.
 */
export async function linkWorkspaceDirectoriesInDB(
	tx: WorkspaceTransaction,
	params: {
		inviterId: string;
		inviteeId: string;
		inviterWorkspaceId: string;
	},
): Promise<DbWorkspaceMember> {
	/** return primary membership - returns the inviter's membership row to save callers an extra read query. */
	const membership = await addWorkspaceDirectoryMemberInDB(
		tx,
		params.inviterWorkspaceId,
		params.inviteeId,
	);

	/** prevent self-invites - short-circuits self-invitations to avoid redundant memberships. */
	if (params.inviterId === params.inviteeId) return membership;

	/**
	 * tolerate missing workspaces - skips reciprocal linking if the invitee
	 * has no workspace yet, deferring the link to the signup flow.
	 */
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
