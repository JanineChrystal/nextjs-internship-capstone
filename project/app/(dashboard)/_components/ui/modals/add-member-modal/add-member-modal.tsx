"use client";

import { useAddMemberModal } from "@/app/(dashboard)/_hooks/use-add-member-modal";
import { Button } from "@/components/ui/buttons/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { AddMemberForm } from "./add-member-form";
import { PendingInvitesTable } from "./pending-invites-table";
import { ShareableLinkSection } from "./shareable-link-section";

interface AddMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scope: "project" | "workspace";
	// Project id for project-scoped invites. Omitted for workspace scope, which
	// resolves the caller's own workspace on the server.
	targetId?: string;
}

export function AddMemberModal({
	open,
	onOpenChange,
	scope,
	targetId = "",
}: AddMemberModalProps) {
	const {
		pendingInvites,
		removePendingInvite,
		form,
		shareLinkConfig,
		shareUrl,
		handleAddStaged,
		handleSendAll,
		handleCancel,
		handleCopyLink,
		handleRegenerateToken,
		handleUpdateDefaultShareRole,
	} = useAddMemberModal(targetId, scope, onOpenChange);

	return (
		<Dialog open={open} onOpenChange={handleCancel}>
			<DialogContent className="sm:max-w-3xl bg-surface-container-lowest border-outline-variant p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-6 pb-4 border-b border-outline-variant bg-surface">
					<DialogTitle className="text-xl font-bold text-on-surface">
						Share {scope === "project" ? "Project" : "Workspace"} & Invite
						Members
					</DialogTitle>
					<DialogDescription className="text-secondary text-sm">
						Invite via Email or Username. Grant direct access with custom roles
						and in-app / email notifications.
					</DialogDescription>
				</DialogHeader>

				<div className="p-6 flex flex-col gap-6 bg-surface-container-lowest">
					<AddMemberForm form={form} onSubmit={handleAddStaged} scope={scope} />

					<PendingInvitesTable
						invites={pendingInvites}
						onRemove={removePendingInvite}
						scope={scope}
					/>

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							className="border-outline-variant text-secondary"
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSendAll}
							disabled={pendingInvites.length === 0}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							Send All
						</Button>
					</div>

					<div className="relative flex items-center py-2">
						<div className="grow border-t border-outline-variant"></div>
						<span className="shrink-0 mx-4 text-xs font-medium text-secondary uppercase">
							OR
						</span>
						<div className="grow border-t border-outline-variant"></div>
					</div>

					<ShareableLinkSection
						shareUrl={shareUrl}
						shareLinkConfig={shareLinkConfig}
						onCopyLink={handleCopyLink}
						onRegenerateToken={handleRegenerateToken}
						onUpdateDefaultRole={handleUpdateDefaultShareRole}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
