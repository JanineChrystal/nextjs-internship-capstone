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
	/**
	 * Drops the cancel button, turning the dialog into an acknowledgement.
	 *
	 * Some of these dialogs report something that has already happened rather
	 * than asking permission for something about to happen. Offering "Cancel"
	 * there implies the action can still be called off, which it cannot.
	 */
	hideCancel?: boolean;
}

/**
 * Compatibility wrapper over `ConfirmDialog`.
 *
 * This was the app's second confirmation design, rendered through `BaseModal`
 * with an icon bubble and colours taken from raw Tailwind palette classes
 * (`text-red-600`, `text-amber-600`) rather than design tokens - so it did not
 * follow the theme and would not have followed the Phase 7 palettes either.
 *
 * It now delegates to the shared dialog, which keeps its eleven call sites
 * working untouched while leaving exactly one component that actually renders a
 * confirmation. Migrate those call sites to `ConfirmDialog` directly as the
 * polish pass reaches each screen, then delete this file.
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
			// Preserves the old behaviour of closing once confirmed. ConfirmDialog
			// leaves that to the caller so a pending mutation can hold it open.
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
