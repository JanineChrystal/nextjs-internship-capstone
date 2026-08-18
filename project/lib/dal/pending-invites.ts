import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import {
	linkWorkspaceDirectoriesInDB,
	resolveActiveWorkspaceDAL,
} from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import { pendingInvites, projectMembers, projects } from "@/lib/db/schema";
import {
	type PendingInviteOutputDTO,
	toPendingInviteDTO,
} from "@/lib/dtos/pending-invite-dto";

export function normalizeInviteEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Records an invitation for an address with no account yet.
 *
 * Uses the resurrect pattern rather than onConflictDoNothing: re-inviting an
 * address whose earlier invite was revoked must restore it, exactly as
 * re-inviting a removed member restores their membership row.
 */
export async function createPendingInviteInDB(params: {
	workspaceId: string;
	projectId: string | null;
	email: string;
	invitedBy: string;
	position?: string;
	accessLevel?: "co-owner" | "member" | "guest";
}): Promise<void> {
	const email = normalizeInviteEmail(params.email);

	// Matches the partial unique indexes exactly: only an outstanding invite is
	// updated in place. A claimed one is history, so re-inviting the same address
	// creates a fresh row rather than reviving a row that would never be claimed
	// again.
	const existing = await db
		.select({ id: pendingInvites.id })
		.from(pendingInvites)
		.where(
			and(
				eq(pendingInvites.workspaceId, params.workspaceId),
				eq(pendingInvites.email, email),
				params.projectId
					? eq(pendingInvites.projectId, params.projectId)
					: isNull(pendingInvites.projectId),
				isNull(pendingInvites.claimedAt),
				isNull(pendingInvites.deletedAt),
			),
		);

	const values = {
		position: params.position?.trim() || "Contributor",
		accessLevel: params.accessLevel ?? ("member" as const),
		updatedAt: new Date(),
	};

	if (existing.length > 0) {
		await db
			.update(pendingInvites)
			.set(values)
			.where(eq(pendingInvites.id, existing[0].id));
		return;
	}

	await db.insert(pendingInvites).values({
		workspaceId: params.workspaceId,
		projectId: params.projectId,
		email,
		invitedBy: params.invitedBy,
		...values,
	});
}

/**
 * Live invitations for a project, for the Team & Access list.
 */
export async function getProjectPendingInvitesDAL(
	projectId: string,
): Promise<PendingInviteOutputDTO[]> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	const rows = await db
		.select()
		.from(pendingInvites)
		.where(
			and(
				eq(pendingInvites.projectId, projectId),
				isNull(pendingInvites.claimedAt),
				isNull(pendingInvites.deletedAt),
			),
		);

	return rows.map((row) => toPendingInviteDTO(row));
}

/**
 * Every live invitation in the caller's workspace, project-scoped or not, for
 * the team page's Pending view. The project name is joined in so a row can say
 * what the invite is actually for.
 */
export async function getWorkspacePendingInvitesDAL(
	workspaceId?: string,
): Promise<PendingInviteOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	const rows = await db
		.select({ invite: pendingInvites, projectName: projects.name })
		.from(pendingInvites)
		.leftJoin(projects, eq(pendingInvites.projectId, projects.id))
		.where(
			and(
				eq(pendingInvites.workspaceId, workspace.id),
				isNull(pendingInvites.claimedAt),
				isNull(pendingInvites.deletedAt),
			),
		);

	return rows.map((row) => toPendingInviteDTO(row.invite, row.projectName));
}

/**
 * Withdraws an invitation. Soft-delete rather than a hard one, so an address
 * that signs up later cannot be granted access by a row we merely stopped
 * showing.
 */
export async function revokePendingInviteDAL(inviteId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const [invite] = await db
		.select()
		.from(pendingInvites)
		.where(
			and(eq(pendingInvites.id, inviteId), isNull(pendingInvites.deletedAt)),
		);

	if (!invite) throw new Error("Invite not found");

	// Project invites are governed by project role; directory-only invites by
	// workspace ownership.
	if (invite.projectId) {
		const role = await getEffectiveProjectRoleDAL(invite.projectId);
		if (role !== "owner" && role !== "co-owner") {
			throw new Error("Unauthorized");
		}
	} else {
		const workspace = await resolveActiveWorkspaceDAL(invite.workspaceId);
		if (workspace.ownerId !== user.id) throw new Error("Unauthorized");
	}

	await db
		.update(pendingInvites)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(eq(pendingInvites.id, inviteId));
}

/**
 * Turns every live invitation for an address into real membership.
 *
 * Called from the Clerk webhook when an account is created, and again from the
 * dashboard as a fallback for when the webhook cannot reach a local dev server.
 * Both paths can therefore run for the same person, so this is written to be
 * idempotent: the upserts are conflict-safe, and each claimed row is stamped so
 * a second pass finds nothing left to do.
 *
 * Deliberately takes its own userId argument rather than reading the session -
 * the webhook has no session at all.
 */
export async function claimPendingInvitesForUserDAL(
	email: string,
	userId: string,
): Promise<{ claimedCount: number }> {
	const normalized = normalizeInviteEmail(email);

	const invites = await db
		.select()
		.from(pendingInvites)
		.where(
			and(
				eq(pendingInvites.email, normalized),
				isNull(pendingInvites.claimedAt),
				isNull(pendingInvites.deletedAt),
			),
		);

	if (invites.length === 0) return { claimedCount: 0 };

	return await db.transaction(async (tx) => {
		for (const invite of invites) {
			// Directory membership is granted by every invite, project-scoped or
			// not - an invited collaborator has to appear in the inviter's people
			// list either way - and it is granted in both directions, so the person
			// who just signed up can find whoever invited them.
			await linkWorkspaceDirectoriesInDB(tx, {
				inviterId: invite.invitedBy,
				inviteeId: userId,
				inviterWorkspaceId: invite.workspaceId,
			});

			if (invite.projectId) {
				await tx
					.insert(projectMembers)
					.values({
						projectId: invite.projectId,
						userId,
						position: invite.position,
						accessLevel: invite.accessLevel,
					})
					.onConflictDoUpdate({
						target: [projectMembers.projectId, projectMembers.userId],
						set: {
							deletedAt: null,
							position: invite.position,
							accessLevel: invite.accessLevel,
							updatedAt: new Date(),
						},
					});
			}

			await tx
				.update(pendingInvites)
				.set({ claimedAt: new Date(), updatedAt: new Date() })
				.where(eq(pendingInvites.id, invite.id));
		}

		return { claimedCount: invites.length };
	});
}
