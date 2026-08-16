import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import { useWorkspaceMemberStore } from "@/stores/use-workspace-member-store";

interface RemovalTarget {
	isOpen: boolean;
	// null means "the current multi-selection", set means a single row.
	userIds: Set<string> | null;
}

const CLOSED_REMOVAL: RemovalTarget = { isOpen: false, userIds: null };

/**
 * Owns the directory data and its mutations. Selection state deliberately lives
 * in a separate hook so sorting/selection re-renders do not touch data logic.
 */
export function useWorkspaceDirectory(
	initialMembers: WorkspaceMemberOutputDTO[],
) {
	const members = useWorkspaceMemberStore((state) => state.members);
	const error = useWorkspaceMemberStore((state) => state.error);
	const setMembers = useWorkspaceMemberStore((state) => state.setMembers);
	const clearError = useWorkspaceMemberStore((state) => state.clearError);
	const removeMembers = useWorkspaceMemberStore((state) => state.removeMembers);

	const [removal, setRemoval] = useState<RemovalTarget>(CLOSED_REMOVAL);
	const isHydrated = useRef(false);

	// Hydrate once from the server-fetched props. Guarded by a ref so client
	// mutations are not overwritten when this effect's deps change.
	useEffect(() => {
		if (!isHydrated.current) {
			setMembers(initialMembers);
			isHydrated.current = true;
		}
	}, [initialMembers, setMembers]);

	const requestRemoveMember = useCallback((userId: string) => {
		setRemoval({ isOpen: true, userIds: new Set([userId]) });
	}, []);

	const requestRemoveSelected = useCallback(() => {
		setRemoval({ isOpen: true, userIds: null });
	}, []);

	const closeRemoval = useCallback(() => setRemoval(CLOSED_REMOVAL), []);

	const confirmRemoval = useCallback(
		async (selectedIds: Set<string>) => {
			const targets = removal.userIds ?? selectedIds;
			setRemoval(CLOSED_REMOVAL);
			return removeMembers(targets);
		},
		[removal.userIds, removeMembers],
	);

	return {
		members,
		error,
		clearError,
		removal,
		requestRemoveMember,
		requestRemoveSelected,
		closeRemoval,
		confirmRemoval,
	};
}
