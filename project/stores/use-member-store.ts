import { create } from "zustand";
import {
	getProjectMembersDetailedAction,
	inviteUserToProjectAction,
	removeMemberAction,
	updateMemberJobRoleAction,
	updateMemberRoleAction,
} from "@/lib/actions/project-member-actions";
import { inviteToWorkspaceAction } from "@/lib/actions/workspace-member-actions";
import type {
	PendingInviteItem,
	ProjectMember,
	RoleAccess,
} from "@/lib/types/member";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";

const INITIAL_MEMBERS: Record<string, ProjectMember[]> = {};

/**
 * invite outcome summary - one toast for a batch rather than one per recipient.
 *
 * Nobody is added immediately any more: an invitation waits for the person to
 * accept it, whether or not they already have an account. The toast says "sent"
 * rather than "added" so it does not promise a membership that does not exist
 * yet.
 */
function reportInviteOutcome(sent: number): void {
	if (sent === 0) return;

	reportActionSuccess(
		sent === 1
			? "Invitation sent. It appears under Pending until they respond."
			: `${sent} invitations sent. They appear under Pending until answered.`,
	);
}

interface MemberState {
	/** store state - primary data objects holding members and pending invites. */
	projectMembers: Record<string, ProjectMember[]>;
	pendingInvites: PendingInviteItem[];
	/** bulk invite errors - surfaces failure messages to the UI instead of silently logging them. */
	inviteError: string | null;
	/** invite revision - bumped after a send so pending-invite lists in other trees reload without a page refresh. */
	invitesVersion: number;

	/** server actions - methods that interact with the backend API to mutate or fetch member data. */
	fetchProjectMembers: (projectId: string) => Promise<void>;
	sendBulkInvites: (
		scope: "project" | "workspace",
		targetId: string,
	) => Promise<void>;
	updateMemberRoleAccess: (
		projectId: string,
		userId: string,
		role: RoleAccess,
	) => Promise<void>;
	updateMemberJobRole: (
		projectId: string,
		userId: string,
		jobRole: string,
	) => Promise<void>;
	removeMember: (projectId: string, userId: string) => Promise<void>;

	/** modal actions - methods that manage local UI state for the invite modal before confirming with the server. */
	addPendingInvite: (invite: PendingInviteItem) => void;
	removePendingInvite: (recipient: string) => void;
	clearPendingInvites: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
	projectMembers: INITIAL_MEMBERS,
	pendingInvites: [],
	inviteError: null,
	invitesVersion: 0,

	addPendingInvite: (invite) =>
		set((state) => ({
			pendingInvites: [...state.pendingInvites, invite],
		})),

	removePendingInvite: (recipient) =>
		set((state) => ({
			pendingInvites: state.pendingInvites.filter(
				(i) => i.recipient !== recipient,
			),
		})),

	clearPendingInvites: () => set({ pendingInvites: [] }),

	fetchProjectMembers: async (projectId) => {
		const result = await getProjectMembersDetailedAction(projectId);
		if (!result.success || !result.data) return;

		const members = result.data as ProjectMember[];
		set((state) => ({
			projectMembers: { ...state.projectMembers, [projectId]: members },
		}));
	},

	sendBulkInvites: async (scope, targetId) => {
		const invites = get().pendingInvites;
		set({ pendingInvites: [] });

		/** sent tally - counted so one toast can summarise the batch. */
		let sent = 0;

		/** workspace invites - processes directory-level invites without attaching them to a specific project. */
		if (scope === "workspace") {
			const failures: string[] = [];

			for (const invite of invites) {
				const result = await inviteToWorkspaceAction(invite.recipient);
				if (!result.success) {
					failures.push(`${invite.recipient}: ${result.error}`);
				} else {
					sent += 1;
				}
			}

			set((state) => ({
				inviteError: failures.length > 0 ? failures.join("\n") : null,
				invitesVersion: state.invitesVersion + 1,
			}));
			reportInviteOutcome(sent);
			return;
		}

		if (scope !== "project") return;

		for (const invite of invites) {
			const result = await inviteUserToProjectAction(
				targetId,
				invite.recipient,
				invite.jobRole,
				invite.roleAccess,
			);
			if (!result.success) {
				reportActionError(`Could not invite ${invite.recipient}`, result.error);
			} else {
				sent += 1;
			}
		}

		set((state) => ({ invitesVersion: state.invitesVersion + 1 }));
		reportInviteOutcome(sent);

		await get().fetchProjectMembers(targetId);
	},

	updateMemberRoleAccess: async (projectId, userId, role) => {
		if (role === "owner") return;
		const previousMembers = get().projectMembers[projectId] || [];
		set((state) => ({
			projectMembers: {
				...state.projectMembers,
				[projectId]: previousMembers.map((m) =>
					m.userId === userId ? { ...m, roleAccess: role } : m,
				),
			},
		}));

		const result = await updateMemberRoleAction(projectId, userId, role);
		if (!result.success) {
			set((state) => ({
				projectMembers: {
					...state.projectMembers,
					[projectId]: previousMembers,
				},
			}));
			reportActionError("Could not change access level", result.error);
		}
	},

	updateMemberJobRole: async (projectId, userId, jobRole) => {
		const previousMembers = get().projectMembers[projectId] || [];
		set((state) => ({
			projectMembers: {
				...state.projectMembers,
				[projectId]: previousMembers.map((m) =>
					m.userId === userId ? { ...m, jobRole } : m,
				),
			},
		}));

		const result = await updateMemberJobRoleAction(projectId, userId, jobRole);
		if (!result.success) {
			set((state) => ({
				projectMembers: {
					...state.projectMembers,
					[projectId]: previousMembers,
				},
			}));
			reportActionError("Could not change position", result.error);
		}
	},

	removeMember: async (projectId, userId) => {
		const previousMembers = get().projectMembers[projectId] || [];
		set((state) => ({
			projectMembers: {
				...state.projectMembers,
				[projectId]: previousMembers.filter((m) => m.userId !== userId),
			},
		}));

		const result = await removeMemberAction(projectId, userId);
		if (!result.success) {
			set((state) => ({
				projectMembers: {
					...state.projectMembers,
					[projectId]: previousMembers,
				},
			}));
			reportActionError("Could not remove member", result.error);
		}
	},
}));
