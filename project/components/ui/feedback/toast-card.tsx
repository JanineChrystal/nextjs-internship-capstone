"use client";

import {
	CheckCircle2,
	Info as InfoIcon,
	TriangleAlert,
	XCircle,
	X as XIcon,
} from "lucide-react";
import type { FeedbackTone } from "@/lib/types/feedback";
import { cn } from "@/lib/utils";

/**
 * One row per tone: the icon, and the three tokens that dress it.
 *
 * Written out in full rather than composed from a string template because
 * Tailwind scans source text for class names - `bg-${tone}-container` produces
 * no CSS at all, and the bug shows up as an invisible toast rather than a build
 * error.
 */
const TONE_STYLES: Record<
	FeedbackTone,
	{ Icon: typeof CheckCircle2; frame: string; icon: string; text: string }
> = {
	success: {
		Icon: CheckCircle2,
		frame: "border-success bg-success-container",
		icon: "text-success",
		text: "text-on-success-container",
	},
	warning: {
		Icon: TriangleAlert,
		frame: "border-warning bg-warning-container",
		icon: "text-warning",
		text: "text-on-warning-container",
	},
	error: {
		Icon: XCircle,
		frame: "border-error bg-error-container",
		icon: "text-error",
		text: "text-on-error-container",
	},
	info: {
		Icon: InfoIcon,
		frame: "border-info bg-info-container",
		icon: "text-info",
		text: "text-on-info-container",
	},
};

/** Announced politely for success and info, assertively for warning and error. */
const TONE_ROLE: Record<FeedbackTone, "status" | "alert"> = {
	success: "status",
	info: "status",
	warning: "alert",
	error: "alert",
};

interface ToastCardProps {
	tone: FeedbackTone;
	message: string;
	/** Optional second line - usually the reason a thing failed. */
	description?: string;
	onDismiss: () => void;
}

/**
 * The visual for every toast in the app.
 *
 * ## Why this is a component and not sonner's `richColors`
 *
 * Sonner's built-in styling is one look with no say over it, and it renders
 * from its own palette rather than the app's tokens - so it would stay the same
 * four colours when the Phase 7 palette picker lands, and would drift from
 * everything around it. Rendering the card ourselves through `toast.custom`
 * means the toast is made of the same tokens as the rest of the app.
 *
 * ## Why the text is not the accent colour
 *
 * The reference design draws the label in the same mid-tone as the border,
 * which measures around 3:1 on its own tint and fails WCAG AA for body text.
 * The border and icon keep that accent - they are large shapes, and 3:1 is the
 * correct bar for a non-text element - while the label uses the darker
 * `on-*-container` step. Side by side the difference reads as intentional
 * weight, not as a different design.
 */
export function ToastCard({
	tone,
	message,
	description,
	onDismiss,
}: ToastCardProps) {
	const { Icon, frame, icon, text } = TONE_STYLES[tone];

	return (
		<output
			role={TONE_ROLE[tone]}
			className={cn(
				"pointer-events-auto flex w-full items-start gap-3 rounded-2xl border-2 p-4 shadow-lg",
				// The reference has a soft coloured halo. `currentColor` at low alpha
				// takes it from the tone rather than hard-coding four shadow colours.
				"shadow-current/10",
				frame,
			)}
		>
			<Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", icon)} />

			<div className={cn("min-w-0 flex-1 space-y-0.5", text)}>
				<p className="text-sm font-medium wrap-break-word">{message}</p>
				{description && (
					<p className="text-xs opacity-80 wrap-break-word">{description}</p>
				)}
			</div>

			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss notification"
				className={cn(
					"-m-1 shrink-0 rounded-md p-1 transition-opacity hover:opacity-70",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40",
					text,
				)}
			>
				<XIcon aria-hidden="true" className="size-4" />
			</button>
		</output>
	);
}
