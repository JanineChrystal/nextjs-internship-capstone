"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/buttons/button";
import { PaletteGrid } from "@/components/ui/palette-grid";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";

/**
 * appearance drawer - a right-hand panel for theme and palette selection
 * that allows users to see live page changes, sharing state with the
 * settings page.
 */

const MODES = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
] as const;

export function AppearanceDrawer() {
	const isOpen = useLandingUiStore((state) => state.isAppearanceOpen);
	const setOpen = useLandingUiStore((state) => state.setAppearanceOpen);
	const { theme, setTheme } = useTheme();

	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				// responsive width - uses full width on mobile and a fixed panel on larger screens to prevent overflow.
				className="w-full overflow-y-auto p-0 sm:max-w-md"
			>
				<SheetHeader className="border-b border-border p-4 sm:p-6">
					<SheetTitle>Appearance</SheetTitle>
					<SheetDescription>
						Switch between light and dark, and pick the colour theme the app
						uses. Both are remembered in this browser.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-col gap-6 p-4 sm:p-6">
					<section className="flex flex-col gap-3">
						<h3 className="text-sm font-medium text-on-surface">Mode</h3>
						{/*
  mode buttons - uses explicit light/dark buttons instead of a single
  toggle icon for clarity, synchronizing with the same theme provider.
*/}
						{/*
  accessibility optimization - omits redundant role="group" to avoid
  extra screen reader announcements, relying on the heading and button
  labels instead.
*/}
						<div className="grid grid-cols-2 gap-2">
							{MODES.map((mode) => (
								<Button
									key={mode.value}
									type="button"
									variant={theme === mode.value ? "default" : "outline"}
									size="lg"
									aria-pressed={theme === mode.value}
									onClick={() => setTheme(mode.value)}
									className="justify-center"
								>
									<mode.icon aria-hidden="true" />
									{mode.label}
								</Button>
							))}
						</div>
						<p className="flex items-start gap-2 text-xs text-secondary">
							<Monitor
								className="mt-0.5 h-3.5 w-3.5 shrink-0"
								aria-hidden="true"
							/>
							Your choice is remembered in this browser.
						</p>
					</section>

					<section className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-medium text-on-surface">
								Colour themes
							</h3>
							<p className="text-xs text-secondary">
								Changes the accent colour - buttons, links and focus rings. Page
								backgrounds stay neutral. Remembered in this browser.
							</p>
						</div>

						<PaletteGrid compact className="grid-cols-2 gap-3" />
					</section>
				</div>
			</SheetContent>
		</Sheet>
	);
}
