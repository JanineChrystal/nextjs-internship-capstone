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
 * tone styles - maps feedback tones to explicit Tailwind utility classes.
 * Classes are fully written out to ensure Tailwind's static analyzer detects
 * and includes them in the build.
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

/** tone role - defines ARIA roles per tone: 'status' for polite announcements, 'alert' for assertive ones. */
const TONE_ROLE: Record<FeedbackTone, "status" | "alert"> = {
	success: "status",
	info: "status",
	warning: "alert",
	error: "alert",
};

interface ToastCardProps {
	tone: FeedbackTone;
	message: string;
	/** detailed description - an optional secondary message, typically used to explain the reason for failure. */
	description?: string;
	onDismiss: () => void;
}

/**
 * toast card - custom UI for Sonner toasts, ensuring they use app-specific
 * design tokens for seamless theme integration. Adjusts text contrast
 * strictly to `on-*-container` colors to guarantee WCAG AA compliance,
 * diverging from potentially low-contrast default designs.
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
				/** dynamic shadow - applies a soft, colored halo inherited via currentColor instead of hardcoding multiple shadow variants. */
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
