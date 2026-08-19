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

interface MemberState {
	// State
	projectMembers: Record<string, ProjectMember[]>;
	pendingInvites: PendingInviteItem[];
	// Surfaced after a bulk invite so failures are visible rather than logged.
	inviteError: string | null;

	// Real, server-backed actions
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

	// Modal Actions
	addPendingInvite: (invite: PendingInviteItem) => void;
	removePendingInvite: (recipient: string) => void;
	clearPendingInvites: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
	projectMembers: INITIAL_MEMBERS,
	pendingInvites: [],
	inviteError: null,

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

		// Workspace-scoped invites add people to the directory only, with no
		// project attached. This branch previously cleared the staged list and
		// returned without ever calling the server, so the team page's "Add
		// Member" silently did nothing.
		if (scope === "workspace") {
			const failures: string[] = [];

			for (const invite of invites) {
				const result = await inviteToWorkspaceAction(invite.recipient);
				if (!result.success) {
					failures.push(`${invite.recipient}: ${result.error}`);
				} else if (result.notice) {
					// Storing an invite for someone without an account is a success,
					// so it is reported as one rather than pushed onto failures.
					reportActionSuccess(result.notice);
				}
			}

			set({ inviteError: failures.length > 0 ? failures.join("\n") : null });
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
			} else if (result.notice) {
				reportActionSuccess(result.notice);
			}
		}

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
