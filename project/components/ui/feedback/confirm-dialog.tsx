"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { useRef } from "react";
import type { ConfirmTone } from "@/lib/types/feedback";
import { cn } from "@/lib/utils";

/**
 * How the confirm button is painted, per tone.
 *
 * These use the `*-solid` tokens rather than the accents. The accents are tuned
 * for borders and icons - large shapes, where 3:1 is the right bar - and putting
 * a 14px label on one measured about 2:1 for warning and info. The solid step
 * exists so a filled button clears 4.5:1, and every tone carries a white label
 * for the same reason: it is the same answer on all three, so the button reads
 * consistently instead of flipping to dark text on one tone.
 */
const TONE_CONFIRM: Record<ConfirmTone, string> = {
	danger: "bg-danger-solid text-on-danger-solid hover:bg-danger-solid/90",
	warning: "bg-warning-solid text-on-warning-solid hover:bg-warning-solid/90",
	info: "bg-info-solid text-on-info-solid hover:bg-info-solid/90",
	// Primary already clears it comfortably in both themes - 12.3:1 light,
	// 10.2:1 dark - so it keeps the app's own pairing rather than inventing one.
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
	 * Drops the cancel button, turning the dialog into an acknowledgement.
	 *
	 * Some of these report something that has already happened rather than
	 * asking permission for something about to happen. Offering "Cancel" there
	 * implies the action can still be called off, which it cannot.
	 */
	hideCancel?: boolean;
	/** Disables both buttons and shows the confirm as busy. */
	isPending?: boolean;
}

/**
 * The one confirmation dialog in the app.
 *
 * ## The layout, and the one place it departs from the reference
 *
 * The reference puts the destructive action on the LEFT and Cancel on the
 * right, which is the iOS convention, and that is what is drawn here. What is
 * NOT copied is the focus order that would normally follow: focus is moved to
 * Cancel when the dialog opens, not to the first button in the DOM.
 *
 * That matters because a confirmation dialog is frequently answered by reflex -
 * the reader has already decided, and presses Enter or Space the moment it
 * appears. If the destructive button holds focus, the dialog becomes a
 * formality that deletes things. Defaulting to Cancel means a reflexive press
 * costs nothing, and confirming takes one deliberate extra key.
 *
 * ## Why this is built on Radix rather than a plain div
 *
 * `AlertDialog` traps focus, restores it to whatever opened the dialog, marks
 * the rest of the page inert for screen readers, and wires Escape - none of
 * which is visible, and all of which is missing from a hand-rolled modal. It
 * also refuses to close on an outside click, which is right here: dismissing a
 * destructive question by clicking past it is too easy to do by accident.
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
					// Focus lands on Cancel rather than the first button - see above.
					onOpenAutoFocus={(event) => {
						if (hideCancel) return;
						event.preventDefault();
						cancelRef.current?.focus();
					}}
					className={cn(
						"fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
						"overflow-hidden rounded-3xl border border-outline-variant/60 p-6",
						// The reference's soft, lit panel: a translucent surface over a
						// blurred backdrop, with a highlight falling from the top edge.
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
						// Radix warns when Content has no Description. Rendering it
						// visually hidden keeps the dialog announced correctly without
						// inventing a sentence to fill the space.
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
								// Radix closes on Action by default. Prevented so a pending
								// mutation can keep the dialog up and disabled; the caller
								// closes it when the work finishes.
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
