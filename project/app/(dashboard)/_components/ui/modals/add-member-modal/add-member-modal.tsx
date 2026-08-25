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

interface AddMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scope: "project" | "workspace";
	// target scope identifier - required for project invites, but omitted for workspace invites as the backend resolves the workspace automatically.
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
		handleAddStaged,
		handleSendAll,
		handleCancel,
	} = useAddMemberModal(targetId, scope, onOpenChange);

	return (
		<Dialog open={open} onOpenChange={handleCancel}>
			{/* column, not grid - the body scrolls on a phone instead of the dialog clipping its own footer. */}
			<DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden bg-surface-container-lowest border-outline-variant p-0 gap-0 sm:max-w-3xl">
				<DialogHeader className="shrink-0 border-b border-outline-variant bg-surface p-4 pb-3 sm:p-6 sm:pb-4">
					<DialogTitle className="text-xl font-bold text-on-surface">
						Share {scope === "project" ? "Project" : "Workspace"} & Invite
						Members
					</DialogTitle>
					<DialogDescription className="text-secondary text-sm">
						Invite via Email or Username. Grant direct access with custom roles
						and in-app / email notifications.
					</DialogDescription>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-surface-container-lowest p-4 sm:gap-6 sm:p-6">
					<AddMemberForm form={form} onSubmit={handleAddStaged} scope={scope} />

					<PendingInvitesTable
						invites={pendingInvites}
						onRemove={removePendingInvite}
						scope={scope}
					/>

					{/* modal actions container */}
					<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
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
				</div>
			</DialogContent>
		</Dialog>
	);
}
