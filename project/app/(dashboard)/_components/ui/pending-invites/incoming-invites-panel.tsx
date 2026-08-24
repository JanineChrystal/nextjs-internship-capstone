"use client";

import { Check, MailQuestion, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import type { PendingInviteOutputDTO } from "@/lib/dtos/pending-invite-dto";

interface IncomingInvitesPanelProps {
	invites: PendingInviteOutputDTO[];
	onRespond: (inviteId: string, response: "accept" | "reject") => Promise<void>;
}

/**
 * incoming invites panel - invitations addressed to the signed-in person, with
 * the accept and reject they previously never got: being invited used to write
 * the membership immediately, so there was nothing to answer.
 */
export function IncomingInvitesPanel({
	invites,
	onRespond,
}: IncomingInvitesPanelProps) {
	/** per-row busy state - keyed by invite so answering one does not disable the others. */
	const [busyId, setBusyId] = useState<string | null>(null);

	if (invites.length === 0) return null;

	const respond = async (inviteId: string, response: "accept" | "reject") => {
		setBusyId(inviteId);
		try {
			await onRespond(inviteId, response);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
			<div className="flex items-center gap-2">
				<MailQuestion className="size-4 shrink-0 text-primary" />
				<h2 className="text-sm font-semibold text-on-surface">
					Invitations for you
					<span className="ml-2 font-normal text-secondary">
						({invites.length})
					</span>
				</h2>
			</div>

			<ul className="flex flex-col gap-2">
				{invites.map((invite) => (
					<li
						key={invite.id}
						className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="min-w-0">
							<p className="wrap-break-word text-sm font-medium text-on-surface">
								{invite.projectName
									? `Project: ${invite.projectName}`
									: "People directory"}
							</p>
							<p className="text-xs text-secondary">
								{invite.projectName
									? `As ${invite.position} with ${invite.accessLevel} access`
									: "Directory access only, with no project attached"}
							</p>
						</div>

						{/* full-width on a phone - two small buttons side by side at 360px are easy to mis-tap, and one of them is not undoable. */}
						<div className="flex shrink-0 gap-2">
							<Button
								type="button"
								size="sm"
								disabled={busyId === invite.id}
								onClick={() => respond(invite.id, "accept")}
								className="h-8 flex-1 gap-1.5 sm:flex-none"
							>
								<Check className="size-4" />
								Accept
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={busyId === invite.id}
								onClick={() => respond(invite.id, "reject")}
								className="h-8 flex-1 gap-1.5 sm:flex-none"
							>
								<X className="size-4" />
								Decline
							</Button>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
