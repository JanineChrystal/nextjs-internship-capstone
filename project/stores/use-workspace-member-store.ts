import { create } from "zustand";
import {
	getWorkspaceDirectoryAction,
	removeWorkspaceMembersAction,
} from "@/lib/actions/workspace-member-actions";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";

interface WorkspaceMemberState {
	members: WorkspaceMemberOutputDTO[];
	error: string | null;

	setMembers: (members: WorkspaceMemberOutputDTO[]) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	refreshMembers: () => Promise<void>;
	removeMembers: (userIds: Set<string>) => Promise<boolean>;
}

export const useWorkspaceMemberStore = create<WorkspaceMemberState>(
	(set, get) => ({
		members: [],
		error: null,

		/** hydration action - populates the initial member list from the server component's fetch. */
		setMembers: (members) => set({ members }),

		setError: (error) => set({ error }),

		clearError: () => set({ error: null }),

		/** external mutation refresh - re-fetches the directory after actions outside this store (like sending invites) to ensure client data stays fresh. */
		refreshMembers: async () => {
			const result = await getWorkspaceDirectoryAction();
			if (result.success && result.data) {
				set({ members: result.data });
			}
		},

		removeMembers: async (userIds) => {
			if (userIds.size === 0) return false;

			/** optimistic state - snapshots the member list before mutation to allow rollback if the server call fails. */
			const previousMembers = get().members;

			set({
				members: previousMembers.filter((member) => !userIds.has(member.id)),
				error: null,
			});

			const result = await removeWorkspaceMembersAction(Array.from(userIds));

			if (!result.success) {
				set({ members: previousMembers, error: result.error ?? null });
				return false;
			}

			return true;
		},
	}),
);
