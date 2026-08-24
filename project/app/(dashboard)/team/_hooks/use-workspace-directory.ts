import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { useMemberStore } from "@/stores/use-member-store";
import { useWorkspaceMemberStore } from "@/stores/use-workspace-member-store";

interface RemovalTarget {
	isOpen: boolean;
	// null means "the current multi-selection", set means a single row.
	userIds: Set<string> | null;
}

const CLOSED_REMOVAL: RemovalTarget = { isOpen: false, userIds: null };

/**
 * use-workspace-directory hook - manages workspace member data and mutations,
 * separated from selection state to prevent display-only re-renders from
 * interfering with data logic.
 */
export function useWorkspaceDirectory(
	initialMembers: WorkspaceMemberOutputDTO[],
) {
	const members = useWorkspaceMemberStore((state) => state.members);
	const setMembers = useWorkspaceMemberStore((state) => state.setMembers);
	const refreshMembers = useWorkspaceMemberStore(
		(state) => state.refreshMembers,
	);
	const removeMembers = useWorkspaceMemberStore((state) => state.removeMembers);

	const [removal, setRemoval] = useState<RemovalTarget>(CLOSED_REMOVAL);
	// pending refresh key - increments to force remounts of the Pending view after new invitations are dispatched.
	const [pendingRefreshKey, setPendingRefreshKey] = useState(0);
	const isHydrated = useRef(false);

	// server hydration guard - ensures initial member data is loaded exactly once without overwriting subsequent client-side mutations.
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
			// removal count snapshot - captures the size of the target set before removal for accurate success reporting.
			const count = targets.size;

			setRemoval(CLOSED_REMOVAL);
			const removed = await removeMembers(targets);

			if (removed) {
				reportActionSuccess(
					`${count} ${count === 1 ? "member" : "members"} removed`,
				);
			} else {
				// transient error handling - retrieves and displays store errors as toasts before clearing them, as inline error banners were removed.
				const reason = useWorkspaceMemberStore.getState().error;
				reportActionError("Could not remove members", reason);
				useWorkspaceMemberStore.getState().clearError();
			}

			return removed;
		},
		[removal.userIds, removeMembers],
	);

	// handle invites settled - synchronizes directory state and processes any errors originating from the member store after the invite modal closes.
	const handleInvitesSettled = useCallback(async () => {
		const inviteError = useMemberStore.getState().inviteError;
		if (inviteError) {
			reportActionError("Could not send every invitation", inviteError);
		}
		useMemberStore.setState({ inviteError: null });
		setPendingRefreshKey((key) => key + 1);
		await refreshMembers();
	}, [refreshMembers]);

	return {
		members,
		removal,
		pendingRefreshKey,
		requestRemoveMember,
		requestRemoveSelected,
		closeRemoval,
		confirmRemoval,
		handleInvitesSettled,
	};
}
