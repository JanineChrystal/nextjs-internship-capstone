"use client";

import { PendingInvitesList } from "@/app/(dashboard)/_components/ui/pending-invites/pending-invites-list";
import { usePendingInvites } from "@/app/(dashboard)/_hooks/use-pending-invites";

/**
 * Every invitation in the workspace that is still waiting on a sign-up,
 * including directory-only ones with no project attached.
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
