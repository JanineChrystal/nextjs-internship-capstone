"use client";

import { IncomingInvitesPanel } from "@/app/(dashboard)/_components/ui/pending-invites/incoming-invites-panel";
import { PendingInvitesList } from "@/app/(dashboard)/_components/ui/pending-invites/pending-invites-list";
import { useIncomingInvites } from "@/app/(dashboard)/_hooks/use-incoming-invites";
import { usePendingInvites } from "@/app/(dashboard)/_hooks/use-pending-invites";
import { SkeletonTable } from "@/components/ui/skeletons";

/**
 * pending view component - two lists that look alike and are not: invitations
 * this workspace has sent and is waiting on, and invitations addressed to you
 * that you can accept or decline. Yours come first, because they are the ones
 * with something to do.
 */
export function PendingView() {
	const { invites, isLoading, revoke } = usePendingInvites("workspace");
	const { invites: incoming, respond } = useIncomingInvites();

	// placeholder rows - replaces a centred "Loading..." line, which collapsed the
	// panel to one row and then pushed the page down when the real list arrived.
	if (isLoading) {
		return (
			<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
				<SkeletonTable rememberAs="team-members" columns={4} />
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
