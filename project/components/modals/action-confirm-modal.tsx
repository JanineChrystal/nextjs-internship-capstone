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
 * Compatibility wrapper over `ConfirmDialog`.
 *
 * This used to render its own Radix dialog, which is how the app ended up with
 * two confirmation designs that had already drifted - this one still carried
 * `text-h3` and `border-surface-variant`, class names for tokens that no longer
 * exist, so it was rendering unstyled text. It now delegates entirely.
 *
 * Kept as a name rather than deleted so its three call sites did not have to be
 * rewritten in the same change that introduced the new design. There is only
 * one renderer, so the two cannot drift again; this file should disappear as
 * the polish pass reaches each of those screens.
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
			// The old component closed itself after confirming. Preserved here so
			// the existing call sites keep working unchanged - ConfirmDialog leaves
			// closing to the caller so a pending mutation can hold the dialog open.
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
