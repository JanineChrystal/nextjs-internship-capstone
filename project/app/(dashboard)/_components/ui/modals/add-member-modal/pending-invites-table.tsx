import { X } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import type { PendingInviteItem } from "@/types/member";

interface PendingInvitesTableProps {
	invites: PendingInviteItem[];
	onRemove: (recipient: string) => void;
	scope?: "project" | "workspace";
}

export function PendingInvitesTable({
	invites,
	onRemove,
	scope = "project",
}: PendingInvitesTableProps) {
	return (
		<div className="flex flex-col gap-2">
			<h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
				Pending Invites ({invites.length})
			</h4>

			{invites.length === 0 ? (
				<div className="border border-dashed border-outline-variant rounded-lg p-8 text-center text-secondary text-sm">
					No pending invites. Add members above.
				</div>
			) : (
				<div className="border border-outline-variant rounded-lg overflow-hidden bg-surface">
					<table className="w-full text-sm text-left">
						<tbody>
							{invites.map((invite) => (
								<tr
									key={invite.recipient}
									className="border-b border-outline-variant last:border-0 hover:bg-surface-variant/30"
								>
									<td className="px-4 py-3 font-medium text-on-surface">
										{invite.recipient}
									</td>
									{scope === "project" && (
										<td className="px-4 py-3 text-secondary">
											{invite.jobRole}
										</td>
									)}
									{scope === "project" && (
										<td className="px-4 py-3 text-secondary capitalize">
											{invite.roleAccess}
										</td>
									)}
									<td className="px-4 py-3 text-right">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => onRemove(invite.recipient)}
											className="text-error hover:text-error hover:bg-error/10 h-8 px-2"
										>
											<X size={14} className="mr-1" />
											Remove
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
