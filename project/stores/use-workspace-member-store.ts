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

		// Hydrated from the server component's initial fetch.
		setMembers: (members) => set({ members }),

		setError: (error) => set({ error }),

		clearError: () => set({ error: null }),

		// Re-pulls the directory after a mutation the store did not perform
		// itself, such as an invite sent from the add-member modal. The page's
		// initial hydration is ref-guarded, so new server data would otherwise
		// never reach the client.
		refreshMembers: async () => {
			const result = await getWorkspaceDirectoryAction();
			if (result.success && result.data) {
				set({ members: result.data });
			}
		},

		removeMembers: async (userIds) => {
			if (userIds.size === 0) return false;

			// Snapshot before mutating so a failed server call can be undone.
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
