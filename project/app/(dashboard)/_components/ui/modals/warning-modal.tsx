"use client";

import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import type { ConfirmTone } from "@/lib/types/feedback";

interface WarningModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "warning" | "info";
	/** hide cancel toggle - drops the cancel button to turn the dialog into an acknowledgement for irreversible actions. */
	hideCancel?: boolean;
}

/**
 * warning modal component - a compatibility wrapper that delegates to ConfirmDialog to centralize confirmation rendering while allowing gradual migration of call sites.
 */
export function WarningModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "danger",
	hideCancel = false,
}: WarningModalProps) {
	return (
		<ConfirmDialog
			isOpen={isOpen}
			onClose={onClose}
			// auto-close behavior - wraps the confirm callback to preserve legacy behavior of closing immediately upon confirmation.
			onConfirm={() => {
				onConfirm();
				onClose();
			}}
			title={title}
			description={message}
			confirmLabel={confirmText}
			cancelLabel={cancelText}
			tone={variant satisfies ConfirmTone}
			hideCancel={hideCancel}
		/>
	);
}
