"use client";

import type * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

/**
 * App-wide toast surface.
 *
 * Exists as a wrapper rather than mounting sonner's Toaster directly so it can
 * follow the app's own theme context - the theme lives in a local provider that
 * writes a class onto <html>, which sonner cannot read on its own.
 *
 * `richColors` and `closeButton` are deliberately gone. Both style sonner's
 * BUILT-IN toasts, and every toast in this app now renders through
 * `ToastCard` via `toast.custom` (see lib/utils/toast.tsx), which brings its
 * own tokens, icons and close button. Leaving them set would do nothing except
 * suggest the built-in path is still in use.
 *
 * `unstyled` strips sonner's own card so the container contributes only
 * positioning and stacking; without it the custom card renders inside sonner's
 * white box and inherits a border it did not ask for.
 */
export function Toaster() {
	const { theme } = useTheme();

	return (
		<SonnerToaster
			theme={theme}
			position="bottom-right"
			toastOptions={{ unstyled: true, classNames: { toast: "w-full" } }}
			// `--width` is sonner's own variable for the toast column, so setting it
			// keeps the library's positioning maths correct - assigning `width`
			// directly would move the card without telling sonner it had moved.
			// Wider than the 356px default because failure toasts carry a reason
			// line, which wraps to four cramped lines at the default.
			style={
				{ "--width": "min(24rem, calc(100vw - 2rem))" } as React.CSSProperties
			}
		/>
	);
}
