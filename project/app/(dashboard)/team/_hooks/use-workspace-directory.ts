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
 * Owns the directory data and its mutations. Selection state deliberately lives
 * in a separate hook so sorting/selection re-renders do not touch data logic.
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
	// Bumped after invites are sent so the Pending view can remount and pick up
	// a newly stored invitation.
	const [pendingRefreshKey, setPendingRefreshKey] = useState(0);
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
			// Counted before the store filters them out, so the toast can say how
			// many went rather than reporting on an already-emptied set.
			const count = targets.size;

			setRemoval(CLOSED_REMOVAL);
			const removed = await removeMembers(targets);

			if (removed) {
				reportActionSuccess(
					`${count} ${count === 1 ? "member" : "members"} removed`,
				);
			} else {
				// The store writes the reason to `error` on the way out. It is read
				// back here, reported as a toast like every other failure in the app,
				// and then cleared - because with the page banner gone there is
				// nothing left to render it, and a value nobody reads would sit in
				// the store forever and suppress nothing.
				const reason = useWorkspaceMemberStore.getState().error;
				reportActionError("Could not remove members", reason);
				useWorkspaceMemberStore.getState().clearError();
			}

			return removed;
		},
		[removal.userIds, removeMembers],
	);

	// Called when the add-member modal closes. Invites are sent by the member
	// store, so this hook has to pull the resulting directory changes in, and
	// report any invite failure the same way removals now do.
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
