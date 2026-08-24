"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getIncomingInvitesAction,
	respondToPendingInviteAction,
} from "@/lib/actions/pending-invite-actions";
import type { PendingInviteOutputDTO } from "@/lib/dtos/pending-invite-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { useMemberStore } from "@/stores/use-member-store";

/**
 * incoming invites hook - the invitations addressed to the signed-in person,
 * and their answer to each. Separate from `usePendingInvites`, which lists the
 * invitations a workspace has *sent*; the two look alike but are opposite sides
 * of the same row and have different controls.
 */
export function useIncomingInvites() {
	const [invites, setInvites] = useState<PendingInviteOutputDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const invitesVersion = useMemberStore((state) => state.invitesVersion);

	const load = useCallback(async () => {
		setIsLoading(true);
		const result = await getIncomingInvitesAction();
		if (result.success && result.data) {
			setInvites(result.data);
		} else if (result.error) {
			reportActionError("Could not load your invitations", result.error);
		}
		setIsLoading(false);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: invitesVersion is the refetch trigger, not a value the effect reads
	useEffect(() => {
		load();
	}, [load, invitesVersion]);

	const respond = useCallback(
		async (inviteId: string, response: "accept" | "reject") => {
			/** optimistic removal - answered either way, the invitation leaves this list; the snapshot puts it back if the server disagrees. */
			const previous = invites;
			setInvites((current) =>
				current.filter((invite) => invite.id !== inviteId),
			);

			const result = await respondToPendingInviteAction(inviteId, response);
			if (!result.success) {
				setInvites(previous);
				reportActionError("Could not answer that invitation", result.error);
				return;
			}

			reportActionSuccess(
				response === "accept"
					? "Invitation accepted. You now have access."
					: "Invitation declined.",
			);
		},
		[invites],
	);

	return { invites, isLoading, respond, refresh: load };
}
