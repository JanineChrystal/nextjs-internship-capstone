import { create } from "zustand";
import type {
	FlaggedCommentItem,
	PendingInviteItem,
	ProjectMember,
	RoleAccess,
	ShareLinkConfig,
} from "@/types/member";

// Mock Data Initializer for the store
const INITIAL_MEMBERS: Record<string, ProjectMember[]> = {
	"prj-1": [
		{
			userId: "usr-1",
			name: "Janine Chrystal",
			email: "janine@example.com",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Janine",
			jobRole: "Project Owner",
			roleAccess: "owner",
			joinedAt: new Date().toISOString(),
		},
		{
			userId: "usr-2",
			name: "Alex Developer",
			email: "alex@example.com",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
			jobRole: "Frontend Developer",
			roleAccess: "member",
			joinedAt: new Date(Date.now() - 86400000).toISOString(),
		},
		{
			userId: "usr-3",
			name: "Sarah Designer",
			email: "sarah@example.com",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
			jobRole: "UI/UX Designer",
			roleAccess: "co-owner",
			joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
		},
		{
			userId: "usr-4",
			name: "Guest User",
			email: "guest@example.com",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
			jobRole: "External Consultant",
			roleAccess: "guest",
			joinedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
		},
	],
};

const INITIAL_FLAGGED_COMMENTS: Record<string, FlaggedCommentItem[]> = {
	"prj-1": [
		{
			commentId: "cmt-1",
			taskId: "task-1",
			taskTitle: "Design responsive Kanban board layout",
			authorName: "John Doe",
			authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
			commentSnippet: "This is completely wrong and looks terrible.",
			flagReason: "Inappropriate language / Toxic behavior",
			flaggedAt: new Date().toISOString(),
		},
	],
};

interface MemberState {
	// State
	projectMembers: Record<string, ProjectMember[]>;
	pendingInvites: PendingInviteItem[];
	shareLinks: Record<string, ShareLinkConfig>;
	flaggedComments: Record<string, FlaggedCommentItem[]>;
	isProjectPublic: Record<string, boolean>;

	// Modal Actions
	addPendingInvite: (invite: PendingInviteItem) => void;
	removePendingInvite: (recipient: string) => void;
	clearPendingInvites: () => void;
	sendBulkInvites: (scope: "project" | "workspace", targetId: string) => void;

	// Settings Actions
	updateMemberRoleAccess: (
		projectId: string,
		userId: string,
		role: RoleAccess,
	) => void;
	updateMemberJobRole: (
		projectId: string,
		userId: string,
		jobRole: string,
	) => void;
	removeMember: (projectId: string, userId: string) => void;

	regenerateShareToken: (projectId: string) => void;
	updateDefaultShareRole: (projectId: string, role: "member" | "guest") => void;

	resolveFlaggedComment: (
		projectId: string,
		commentId: string,
		action: "accept" | "reject",
	) => void;

	toggleProjectVisibility: (projectId: string, isPublic: boolean) => void;
}

export const useMemberStore = create<MemberState>((set) => ({
	projectMembers: INITIAL_MEMBERS,
	pendingInvites: [],
	shareLinks: {
		"prj-1": {
			projectId: "prj-1",
			inviteToken: "inv_random123",
			defaultRole: "member",
		},
	},
	flaggedComments: INITIAL_FLAGGED_COMMENTS,
	isProjectPublic: {
		"prj-1": false,
	},

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

	sendBulkInvites: (scope, targetId) =>
		set((state) => {
			// In a real app, this would dispatch an API call here.
			console.log(
				`Sending bulk invites for ${scope} ${targetId}`,
				state.pendingInvites,
			);

			// Mocking adding them instantly for UI demonstration:
			if (scope === "project") {
				const newMembers = state.pendingInvites.map((invite, index) => ({
					userId: `new-usr-${Date.now()}-${index}`,
					name: invite.recipient.split("@")[0],
					email: invite.recipient.includes("@")
						? invite.recipient
						: `${invite.recipient}@example.com`,
					avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.recipient}`,
					jobRole: invite.jobRole,
					roleAccess: invite.roleAccess,
					joinedAt: new Date().toISOString(),
				}));

				const currentProjectMembers = state.projectMembers[targetId] || [];
				return {
					pendingInvites: [], // clear queue
					projectMembers: {
						...state.projectMembers,
						[targetId]: [...currentProjectMembers, ...newMembers],
					},
				};
			}

			// Workspace logic placeholder
			return { pendingInvites: [] };
		}),

	updateMemberRoleAccess: (projectId, userId, role) =>
		set((state) => {
			const members = state.projectMembers[projectId] || [];
			return {
				projectMembers: {
					...state.projectMembers,
					[projectId]: members.map((m) =>
						m.userId === userId ? { ...m, roleAccess: role } : m,
					),
				},
			};
		}),

	updateMemberJobRole: (projectId, userId, jobRole) =>
		set((state) => {
			const members = state.projectMembers[projectId] || [];
			return {
				projectMembers: {
					...state.projectMembers,
					[projectId]: members.map((m) =>
						m.userId === userId ? { ...m, jobRole: jobRole } : m,
					),
				},
			};
		}),

	removeMember: (projectId, userId) =>
		set((state) => {
			const members = state.projectMembers[projectId] || [];
			return {
				projectMembers: {
					...state.projectMembers,
					[projectId]: members.filter((m) => m.userId !== userId),
				},
			};
		}),

	regenerateShareToken: (projectId) =>
		set((state) => {
			const config = state.shareLinks[projectId] || {
				projectId,
				inviteToken: "",
				defaultRole: "member",
			};
			return {
				shareLinks: {
					...state.shareLinks,
					[projectId]: {
						...config,
						inviteToken: `inv_${Math.random().toString(36).substring(2, 10)}`,
					},
				},
			};
		}),

	updateDefaultShareRole: (projectId, role) =>
		set((state) => {
			const config = state.shareLinks[projectId] || {
				projectId,
				inviteToken: "",
				defaultRole: "member",
			};
			return {
				shareLinks: {
					...state.shareLinks,
					[projectId]: {
						...config,
						defaultRole: role,
					},
				},
			};
		}),

	resolveFlaggedComment: (projectId, commentId, action) =>
		set((state) => {
			// Log action for debugging / backend readiness (accept = dismiss flag, reject = delete comment)
			console.log(
				`[Moderation] Resolved comment ${commentId} on project ${projectId} with action: ${action}`,
			);
			const comments = state.flaggedComments[projectId] || [];
			return {
				flaggedComments: {
					...state.flaggedComments,
					[projectId]: comments.filter((c) => c.commentId !== commentId),
				},
			};
		}),

	toggleProjectVisibility: (projectId, isPublic) =>
		set((state) => ({
			isProjectPublic: {
				...state.isProjectPublic,
				[projectId]: isPublic,
			},
		})),
}));
