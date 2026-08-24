"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { useRef } from "react";
import type { ConfirmTone } from "@/lib/types/feedback";
import { cn } from "@/lib/utils";

/**
 * tone confirm styles - maps feedback tones to `*-solid` colors to ensure
 * button contrast consistently exceeds 4.5:1, prioritizing readability
 * over the standard accent colors used for larger shapes.
 */
const TONE_CONFIRM: Record<ConfirmTone, string> = {
	danger: "bg-danger-solid text-on-danger-solid hover:bg-danger-solid/90",
	warning: "bg-warning-solid text-on-warning-solid hover:bg-warning-solid/90",
	info: "bg-info-solid text-on-info-solid hover:bg-info-solid/90",
	/** default fallback - primary already clears contrast comfortably in both themes, so it keeps the app's own pairing rather than inventing one. */
	default: "bg-primary text-primary-foreground hover:bg-primary/90",
};

const BUTTON_BASE = cn(
	"h-11 w-full rounded-xl text-sm font-medium transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest",
	"disabled:pointer-events-none disabled:opacity-50",
);

interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: ConfirmTone;
	/**
	 * hide cancel button - transforms the dialog into an acknowledgment by
	 * removing the cancel option, appropriate for reporting irreversible
	 * past events.
	 */
	hideCancel?: boolean;
	/** pending state - disables all buttons and indicates a background process is active. */
	isPending?: boolean;
}

/**
 * confirm dialog - a centralized, accessible dialog built on Radix UI that
 * places destructive actions on the left but purposefully defaults focus to
 * 'Cancel' to prevent accidental, reflexive confirmations. Disables outside
 * clicks to mandate explicit user choice.
 */
export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	tone = "danger",
	hideCancel = false,
	isPending = false,
}: ConfirmDialogProps) {
	const cancelRef = useRef<HTMLButtonElement>(null);

	return (
		<AlertDialogPrimitive.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<AlertDialogPrimitive.Portal>
				<AlertDialogPrimitive.Overlay
					className={cn(
						"fixed inset-0 z-50 bg-black/50 duration-150",
						"supports-backdrop-filter:backdrop-blur-sm",
						"data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
					)}
				/>
				<AlertDialogPrimitive.Content
					/** focus cancel - deliberately forces focus to the Cancel button to prevent accidental confirmations. */
					onOpenAutoFocus={(event) => {
						if (hideCancel) return;
						event.preventDefault();
						cancelRef.current?.focus();
					}}
					className={cn(
						"fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
						"overflow-hidden rounded-3xl border border-outline-variant/60 p-6",
						/** glassmorphic surface - styles the dialog as a lit, translucent panel over a blurred backdrop. */
						"bg-surface-container-lowest/85 shadow-2xl supports-backdrop-filter:backdrop-blur-2xl",
						"bg-linear-to-b from-surface-container-high/60 to-transparent",
						"duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
						"data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
					)}
				>
					<AlertDialogPrimitive.Title className="text-balance text-center text-lg font-semibold text-on-surface">
						{title}
					</AlertDialogPrimitive.Title>

					{description ? (
						<AlertDialogPrimitive.Description className="mt-2 text-balance text-center text-sm text-on-surface-variant">
							{description}
						</AlertDialogPrimitive.Description>
					) : (
						/** visually hidden description - provides screen readers with the required description element without altering the visual layout. */
						<AlertDialogPrimitive.Description className="sr-only">
							{title}
						</AlertDialogPrimitive.Description>
					)}

					<div
						className={cn(
							"mt-6 grid gap-3",
							hideCancel ? "grid-cols-1" : "grid-cols-2",
						)}
					>
						<AlertDialogPrimitive.Action
							disabled={isPending}
							onClick={(event) => {
								/**
								 * prevent auto-close - overrides Radix's default close behavior so
								 * the dialog can persist in a pending state during async mutations.
								 */
								event.preventDefault();
								onConfirm();
							}}
							className={cn(BUTTON_BASE, TONE_CONFIRM[tone])}
						>
							{isPending ? "Working…" : confirmLabel}
						</AlertDialogPrimitive.Action>

						{!hideCancel && (
							<AlertDialogPrimitive.Cancel
								ref={cancelRef}
								disabled={isPending}
								className={cn(
									BUTTON_BASE,
									"border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high",
								)}
							>
								{cancelLabel}
							</AlertDialogPrimitive.Cancel>
						)}
					</div>
				</AlertDialogPrimitive.Content>
			</AlertDialogPrimitive.Portal>
		</AlertDialogPrimitive.Root>
	);
}
