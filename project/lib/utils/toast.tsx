"use client";

import { toast } from "sonner";
import { ToastCard } from "@/components/ui/feedback/toast-card";
import type { FeedbackTone } from "@/lib/types/feedback";

/**
 * How long each tone stays on screen, in milliseconds.
 *
 * Not one number for all four. A success is a receipt - it is read in a glance
 * and then it is in the way. A failure carries a reason the reader may need to
 * copy or act on, and taking that away on the same timer is how people end up
 * repeating an action without ever learning why it failed.
 */
const TONE_DURATION: Record<FeedbackTone, number> = {
	success: 4000,
	info: 5000,
	warning: 7000,
	error: 9000,
};

interface NotifyOptions {
	/** description - a second line: the reason, or what happens next. */
	description?: string;
	/** Overrides the tone's default lifetime. `Infinity` pins it open. */
	duration?: number;
	/**
	 * Reuses one toast slot for a repeated event instead of stacking copies.
	 *
	 * Without this, a bulk action that fails on eight rows produces eight
	 * identical toasts and buries everything else on screen.
	 */
	id?: string;
}

function show(
	tone: FeedbackTone,
	message: string,
	options?: NotifyOptions,
): string | number {
	return toast.custom(
		(id) => (
			<ToastCard
				tone={tone}
				message={message}
				description={options?.description}
				onDismiss={() => toast.dismiss(id)}
			/>
		),
		{
			duration: options?.duration ?? TONE_DURATION[tone],
			id: options?.id,
		},
	);
}

/**
 * The one way to raise a toast in this app.
 *
 * Every call renders `ToastCard`, so the four tones cannot drift apart and a
 * change to how toasts look is a change to one file. Call sites choose meaning
 * (`notify.success`) rather than appearance, which is what keeps a success from
 * ever being drawn in the failure colours.
 */
export const notify = {
	success: (message: string, options?: NotifyOptions) =>
		show("success", message, options),
	warning: (message: string, options?: NotifyOptions) =>
		show("warning", message, options),
	error: (message: string, options?: NotifyOptions) =>
		show("error", message, options),
	info: (message: string, options?: NotifyOptions) =>
		show("info", message, options),
	/** Closes one toast by the id returned above, or all of them when omitted. */
	dismiss: (id?: string | number) => toast.dismiss(id),
};

/**
 * Client-side reporting for a failed server action.
 *
 * Every mutation in this app updates the store optimistically and rolls back on
 * failure. Rolling back silently is indistinguishable from "the app ignored me",
 * and it hid a real permission bug during testing - so the rollback and this
 * call belong together at every call site.
 *
 * The console line is kept as well: the toast is for the user, the console entry
 * carries the original error and its `cause` chain for debugging.
 */
export function reportActionError(context: string, error?: unknown): void {
	console.error(`${context}:`, error);
	notify.error(context, { description: toReason(error) });
}

export function reportActionSuccess(message: string): void {
	notify.success(message);
}

/**
 * The server actions in this codebase reject in two shapes - a returned
 * `{ success: false, error }` string and a thrown Error - so both are unwrapped
 * here rather than at each of the ~36 call sites.
 */
function toReason(error: unknown): string | undefined {
	if (typeof error === "string") return error || undefined;
	if (error instanceof Error) return error.message || undefined;
	return undefined;
}
