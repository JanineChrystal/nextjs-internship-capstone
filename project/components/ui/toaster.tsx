"use client";

import type * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

/**
 * toaster wrapper - provides the app-wide Sonner toast container, syncing
 * its theme explicitly with the app's context. Runs entirely 'unstyled'
 * because all in-app toasts use the custom `ToastCard` component, ignoring
 * Sonner's built-in styles completely.
 */
export function Toaster() {
	const { theme } = useTheme();

	return (
		<SonnerToaster
			theme={theme}
			position="bottom-right"
			toastOptions={{ unstyled: true, classNames: { toast: "w-full" } }}
			/**
			 * custom column width - overrides Sonner's `--width` variable to safely
			 * widen toasts without breaking its positioning math, ensuring detailed
			 * failure messages don't awkwardly wrap.
			 */
			style={
				{ "--width": "min(24rem, calc(100vw - 2rem))" } as React.CSSProperties
			}
		/>
	);
}
