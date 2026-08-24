"use client";

import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";

interface ActionConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
}

/**
 * action confirm modal - serves as a legacy compatibility wrapper over
 * ConfirmDialog to prevent visual drift without requiring immediate
 * rewrites of existing call sites, slated for eventual removal.
 */
export function ActionConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	isDestructive = false,
}: ActionConfirmModalProps) {
	return (
		<ConfirmDialog
			isOpen={isOpen}
			onClose={onClose}
			/**
			 * preserve legacy auto-close - maintains the old component's behavior
			 * of closing itself after confirming, keeping existing call sites
			 * functional without modification.
			 */
			onConfirm={() => {
				onConfirm();
				onClose();
			}}
			title={title}
			description={description}
			confirmLabel={confirmText}
			cancelLabel={cancelText}
			tone={isDestructive ? "danger" : "default"}
		/>
	);
}
