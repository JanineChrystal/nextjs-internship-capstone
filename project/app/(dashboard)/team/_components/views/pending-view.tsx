"use client";

import { IncomingInvitesPanel } from "@/app/(dashboard)/_components/ui/pending-invites/incoming-invites-panel";
import { PendingInvitesList } from "@/app/(dashboard)/_components/ui/pending-invites/pending-invites-list";
import { useIncomingInvites } from "@/app/(dashboard)/_hooks/use-incoming-invites";
import { usePendingInvites } from "@/app/(dashboard)/_hooks/use-pending-invites";

/**
 * pending view component - two lists that look alike and are not: invitations
 * this workspace has sent and is waiting on, and invitations addressed to you
 * that you can accept or decline. Yours come first, because they are the ones
 * with something to do.
 */
export function PendingView() {
	const { invites, isLoading, revoke } = usePendingInvites("workspace");
	const { invites: incoming, respond } = useIncomingInvites();

	if (isLoading) {
		return (
			<div className="py-10 text-center text-sm text-secondary">
				Loading pending invites...
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<IncomingInvitesPanel invites={incoming} onRespond={respond} />

			<PendingInvitesList
				invites={invites}
				onRevoke={revoke}
				showProject
				emptyMessage="No pending invites. Invitations you send appear here until the person accepts or declines them."
			/>
		</div>
	);
}
