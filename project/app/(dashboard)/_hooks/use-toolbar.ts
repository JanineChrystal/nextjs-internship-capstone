import { useMemo, useState } from "react";
import { MAX_VISIBLE_MEMBERS } from "@/app/(dashboard)/projects/_constants/project";
import { emptyMembers } from "@/app/(dashboard)/projects/_constants/settings-view";
import { useMemberStore } from "@/stores/use-member-store";

export function useToolbar(projectId: string) {
	// Local state for modal display toggle
	const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

	// Select members using static empty array fallback to prevent getSnapshot reference loops
	const members = useMemberStore(
		(state) => state.projectMembers[projectId] ?? emptyMembers,
	);

	// Derived state for visible members subset and overflow count
	const visibleMembers = useMemo(
		() => members.slice(0, MAX_VISIBLE_MEMBERS),
		[members],
	);
	const remainingCount = useMemo(
		() =>
			members.length > MAX_VISIBLE_MEMBERS
				? members.length - MAX_VISIBLE_MEMBERS
				: 0,
		[members],
	);

	return {
		isAddMemberModalOpen,
		setIsAddMemberModalOpen,
		visibleMembers,
		remainingCount,
	};
}

// Alias for backwards compatibility
export const useProjectToolbar = useToolbar;
