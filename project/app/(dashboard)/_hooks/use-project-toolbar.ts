import { useMemo, useState } from "react";
import { useMemberStore } from "@/stores/use-member-store";
import type { ProjectMember } from "@/types/member";

const MAX_VISIBLE_MEMBERS = 5;
const EMPTY_MEMBERS: ProjectMember[] = [];

export function useProjectToolbar(projectId: string) {
	// Local state for modal display toggle
	const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

	// Select members using static empty array fallback to prevent getSnapshot reference loops
	const members = useMemberStore(
		(state) => state.projectMembers[projectId] ?? EMPTY_MEMBERS,
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
