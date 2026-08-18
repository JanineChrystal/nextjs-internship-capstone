"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

/**
 * App-wide toast surface.
 *
 * Exists as a wrapper rather than mounting sonner's Toaster directly so it can
 * follow the app's own theme context - the theme lives in a local provider that
 * writes a class onto <html>, which sonner cannot read on its own.
 */
export function Toaster() {
	const { theme } = useTheme();

	return (
		<SonnerToaster
			theme={theme}
			position="bottom-right"
			richColors
			closeButton
			duration={6000}
		/>
	);
}
