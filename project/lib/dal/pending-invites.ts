import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { recordActivity } from "@/lib/dal/activity-recorder";
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
 * create pending invite - records an invitation for an unregistered email,
 * utilizing a resurrection pattern to properly restore previously revoked
 * invitations.
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

	/**
	 * precise invite resolution - matches partial unique indexes to ensure
	 * only outstanding invites are updated, preventing the revival of
	 * already-claimed historical records.
	 */
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

/** get project pending invites - retrieves all active invitations scoped to a specific project. */
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
 * get workspace pending invites - retrieves all active invitations within
 * the caller's workspace, joining project names to provide context for
 * project-scoped invites.
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
 * revoke pending invite - withdraws an invitation via soft deletion to
 * securely prevent late signups from claiming access we intended to revoke.
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

	/** route authorization - governs project invites via project roles and directory invites via workspace ownership. */
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
 * grant one invite - the membership writes a single invitation implies, shared
 * by the signup sweep and by a person accepting an invitation by hand so the two
 * routes cannot grant different things.
 */
async function grantInviteInTx(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	invite: typeof pendingInvites.$inferSelect,
	userId: string,
): Promise<void> {
	/**
	 * mutual directory linking - ensures every invite establishes a
	 * two-way directory relationship, allowing both inviter and invitee
	 * to find each other post-signup.
	 */
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

/**
 * incoming invites - invitations addressed to the signed-in person that are
 * still outstanding. Keyed by email rather than user id because that is what an
 * invite carries: it may well have been written before this account existed.
 */
export async function getIncomingInvitesDAL(): Promise<
	PendingInviteOutputDTO[]
> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const rows = await db
		.select({ invite: pendingInvites, projectName: projects.name })
		.from(pendingInvites)
		.leftJoin(projects, eq(pendingInvites.projectId, projects.id))
		.where(
			and(
				eq(pendingInvites.email, normalizeInviteEmail(user.email)),
				isNull(pendingInvites.claimedAt),
				isNull(pendingInvites.deletedAt),
			),
		);

	return rows.map((row) => toPendingInviteDTO(row.invite, row.projectName));
}

/**
 * respond to an invitation - the invitee's own accept or reject.
 *
 * Authorisation is by email match, not by any permission: the only person who
 * may answer an invitation is the person it was addressed to, and that holds
 * even for a workspace owner looking at someone else's invite.
 */
export async function respondToPendingInviteDAL(
	inviteId: string,
	response: "accept" | "reject",
): Promise<{ projectId: string | null }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const [invite] = await db
		.select()
		.from(pendingInvites)
		.where(
			and(
				eq(pendingInvites.id, inviteId),
				eq(pendingInvites.email, normalizeInviteEmail(user.email)),
				isNull(pendingInvites.claimedAt),
				isNull(pendingInvites.deletedAt),
			),
		);

	if (!invite) throw new Error("Invite not found");

	if (response === "reject") {
		/**
		 * soft delete as decline - the unique indexes that stop duplicate invites
		 * are scoped to outstanding rows, so a declined invitation leaves the
		 * address free to be invited again rather than blocking it forever.
		 */
		await db
			.update(pendingInvites)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(pendingInvites.id, inviteId));

		return { projectId: invite.projectId };
	}

	await db.transaction(async (tx) => {
		await grantInviteInTx(tx, invite, user.id);
	});

	/** logged after the commit - the same ordering the signup sweep uses, so a bookkeeping failure cannot roll back an access grant that already succeeded. */
	await recordActivity({
		workspaceId: invite.workspaceId,
		actorId: user.id,
		actionType: "INVITE_ACCEPTED",
		details: `${invite.email} accepted an invitation`,
		projectId: invite.projectId,
		targetUserId: invite.invitedBy,
		notify: [
			{
				recipientId: invite.invitedBy,
				message: `${invite.email} accepted your invitation`,
			},
		],
	});

	return { projectId: invite.projectId };
}

/**
 * claim pending invites - idempotently converts all outstanding invitations
 * for an email into actual memberships, designed to be safely callable
 * from both webhooks and dashboard fallbacks.
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

	const result = await db.transaction(async (tx) => {
		for (const invite of invites) {
			await grantInviteInTx(tx, invite, userId);
		}

		return { claimedCount: invites.length };
	});

	/**
	 * decoupled activity logging - records the acceptance after the grant
	 * transaction commits to prevent bookkeeping failures from rolling back
	 * successful access grants.
	 */
	for (const invite of invites) {
		await recordActivity({
			workspaceId: invite.workspaceId,
			actorId: userId,
			actionType: "INVITE_ACCEPTED",
			details: `${normalized} accepted an invitation`,
			projectId: invite.projectId,
			targetUserId: invite.invitedBy,
			/** target inviter - explicitly notifies the original inviter who is awaiting the acceptance. */
			notify: [
				{
					recipientId: invite.invitedBy,
					message: `${normalized} accepted your invitation`,
				},
			],
		});
	}

	return result;
}
