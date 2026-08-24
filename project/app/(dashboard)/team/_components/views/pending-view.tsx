"use client";

import { PendingInvitesList } from "@/app/(dashboard)/_components/ui/pending-invites/pending-invites-list";
import { usePendingInvites } from "@/app/(dashboard)/_hooks/use-pending-invites";

/**
 * pending view component - displays a list of all active workspace invitations
 * that have not yet been accepted by the invitees, regardless of project attachment.
 */
export function PendingView() {
	const { invites, isLoading, revoke } = usePendingInvites("workspace");

	if (isLoading) {
		return (
			<div className="py-10 text-center text-sm text-secondary">
				Loading pending invites...
			</div>
		);
	}

	return (
		<PendingInvitesList
			invites={invites}
			onRevoke={revoke}
			showProject
			emptyMessage="No pending invites. Invitations to people who have not signed up yet will appear here."
		/>
	);
}
