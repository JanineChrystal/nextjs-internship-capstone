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
 * Light/dark plus the palette picker, in a right-hand drawer.
 *
 * Right rather than bottom because this is a tall list - twelve palette cards -
 * and a full-height side panel can show several at once while leaving the page
 * behind it visible. That last part is the actual point: someone choosing a
 * theme wants to see the page change, so the panel deliberately covers the edge
 * of the screen rather than the middle of it.
 *
 * The palette grid is the *same component* the Settings > Appearance section
 * renders, imported from components/ui rather than copied, and it reads and
 * writes through the shared `usePalette` hook. That is what the request for "the
 * same as the appearance in settings" has to mean in practice: making the cards
 * clickable was one edit that both surfaces gained at once, and a palette chosen
 * here is already selected when the reader next opens Settings.
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
				// Full width on a phone, a fixed panel from the small breakpoint up.
				// A 400px drawer on a 360px screen would sit off the edge.
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
						  A two-button group rather than the global ThemeToggle. The
						  toggle is a single icon that flips - correct in a dense top
						  bar where space is the constraint, wrong here, where showing
						  both options and marking the current one is clearer and there
						  is room for it. Both read and write the same provider, so they
						  can never disagree.
						*/}
						{/* No role="group" here: the "Mode" heading above already names
						    this set, and each button carries its own visible label plus
						    aria-pressed, so a redundant group role would only add a layer
						    for a screen reader to announce and step through. */}
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
