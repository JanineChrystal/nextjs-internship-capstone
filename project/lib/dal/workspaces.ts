import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
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
