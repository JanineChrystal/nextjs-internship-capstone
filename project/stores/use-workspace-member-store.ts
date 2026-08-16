import { create } from "zustand";
import { removeWorkspaceMembersAction } from "@/lib/actions/workspace-member-actions";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";

interface WorkspaceMemberState {
	members: WorkspaceMemberOutputDTO[];
	error: string | null;

	setMembers: (members: WorkspaceMemberOutputDTO[]) => void;
	clearError: () => void;
	removeMembers: (userIds: Set<string>) => Promise<boolean>;
}

export const useWorkspaceMemberStore = create<WorkspaceMemberState>(
	(set, get) => ({
		members: [],
		error: null,

		// Hydrated from the server component's initial fetch.
		setMembers: (members) => set({ members }),

		clearError: () => set({ error: null }),

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
