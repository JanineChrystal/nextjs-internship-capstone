"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getProjectPendingInvitesAction,
	getWorkspacePendingInvitesAction,
	revokePendingInviteAction,
} from "@/lib/actions/pending-invite-actions";
import type { PendingInviteOutputDTO } from "@/lib/dtos/pending-invite-dto";
import { reportActionError } from "@/lib/utils/toast";
import { useMemberStore } from "@/stores/use-member-store";

/**
 * pending invites hook - loads and manages pending invitations for a specific scope.
 * implemented as a hook instead of a global store to ensure fresh data fetching on mount since the surfaces using this are never active simultaneously.
 */
export function usePendingInvites(
	scope: "project" | "workspace",
	projectId?: string,
) {
	const [invites, setInvites] = useState<PendingInviteOutputDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	/** send signal - the invite modal lives in a different tree from this list, so a revision counter in the member store is what tells it to reload; without it a new invite only appeared after a manual page refresh. */
	const invitesVersion = useMemberStore((state) => state.invitesVersion);

	const load = useCallback(async () => {
		if (scope === "project" && !projectId) return;

		setIsLoading(true);
		const result =
			scope === "project"
				? await getProjectPendingInvitesAction(projectId as string)
				: await getWorkspacePendingInvitesAction();

		if (result.success && result.data) {
			setInvites(result.data);
		} else if (result.error) {
			reportActionError("Could not load pending invites", result.error);
		}
		setIsLoading(false);
	}, [scope, projectId]);

	const revoke = useCallback(async (inviteId: string) => {
		let previous: PendingInviteOutputDTO[] = [];

		// stable revoke callback - uses functional state updates to avoid depending on the invites array, preventing unnecessary row re-renders.
		setInvites((current) => {
			previous = current;
			return current.filter((invite) => invite.id !== inviteId);
		});

		const result = await revokePendingInviteAction(inviteId);
		if (!result.success) {
			setInvites(previous);
			reportActionError("Could not revoke invite", result.error);
		}
	}, []);

	// load effect - runs on mount and again whenever a batch of invites is sent.
	// biome-ignore lint/correctness/useExhaustiveDependencies: invitesVersion is the refetch trigger, not a value the effect reads
	useEffect(() => {
		load();
	}, [load, invitesVersion]);

	return { invites, isLoading, refresh: load, revoke };
}
