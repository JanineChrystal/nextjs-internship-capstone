"use client";

import { MailQuestion, X } from "lucide-react";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import { Button } from "@/components/ui/buttons/button";
import { GridTable } from "@/components/views/grid-table/grid-table";
import type { PendingInviteOutputDTO } from "@/lib/dtos/pending-invite-dto";
import {
	PENDING_INVITE_COLUMNS,
	PENDING_INVITE_COLUMNS_WITH_PROJECT,
} from "../../../_constants/pending-invites";

interface PendingInvitesListProps {
	invites: PendingInviteOutputDTO[];
	onRevoke: (inviteId: string) => void;
	canRevoke?: boolean;
	// project visibility toggle - used to display the project name when listing invites globally on the team page, as opposed to within specific project settings.
	showProject?: boolean;
	emptyMessage?: string;
}

/**
 * pending invites list component - renders a table of pending invitations, shared between project settings and the global team page to maintain consistency.
 */
export function PendingInvitesList({
	invites,
	onRevoke,
	canRevoke = true,
	showProject = false,
	emptyMessage = "No pending invites.",
}: PendingInvitesListProps) {
	const columns = showProject
		? PENDING_INVITE_COLUMNS_WITH_PROJECT
		: PENDING_INVITE_COLUMNS;

	return (
		<GridTable
			data={invites}
			columns={columns}
			keyExtractor={(invite) => invite.id}
			renderEmptyState={() => (
				<div className="flex flex-col items-center justify-center py-10 border-t border-dashed border-outline-variant bg-surface-container-lowest">
					<MailQuestion size={40} className="text-secondary/50 mb-3" />
					<p className="text-sm text-secondary">{emptyMessage}</p>
				</div>
			)}
			renderRow={(invite) => (
				<>
					<div className="flex-2 min-w-55 flex items-center gap-3">
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-secondary">
							<MailQuestion size={16} />
						</span>
						<div className="min-w-0">
							<p className="text-sm text-on-surface truncate">{invite.email}</p>
							<p className="text-xs text-secondary">Waiting for sign-up</p>
						</div>
					</div>

					{showProject && (
						<div className="w-48 text-sm text-secondary truncate">
							{invite.projectName ?? "Directory only"}
						</div>
					)}

					<div className="w-40 text-sm text-secondary truncate">
						{invite.position}
					</div>

					<div className="w-36">
						<TagBadge tag={invite.accessLevel} />
					</div>

					<div className="w-32 text-sm text-secondary">
						{new Date(invite.invitedAt).toLocaleDateString()}
					</div>

					<div className="w-16 flex justify-end">
						{canRevoke && (
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => onRevoke(invite.id)}
								aria-label={`Revoke invite for ${invite.email}`}
								className="text-secondary hover:text-error"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				</>
			)}
		/>
	);
}
