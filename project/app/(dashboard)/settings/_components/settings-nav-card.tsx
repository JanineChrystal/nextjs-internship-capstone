"use client";

import { BaseCard } from "@/components/ui/cards/base-card";
import { SETTINGS_NAV } from "@/lib/constants/settings-nav";
import { cn } from "@/lib/utils";
import { useSettingsNavStore } from "@/stores/use-settings-nav-store";

/**
 * The in-page copy of the settings menu.
 *
 * The same four entries appear in the app sidebar, and both drive the identical
 * store action - so this is not a second implementation, it is a second mount
 * point for one. It earns its place because the sidebar collapses to icons and
 * can be closed entirely, and a one-page settings screen with four long sections
 * is unusable without a visible index.
 *
 * Sticky so it stays beside whatever the reader has scrolled to.
 */
export function SettingsNavCard() {
	const activeNavId = useSettingsNavStore((state) => state.activeNavId);
	const requestScrollTo = useSettingsNavStore((state) => state.requestScrollTo);

	return (
		<BaseCard className="hover:scale-100 h-fit lg:sticky lg:top-6 gap-3">
			<h2 className="text-sm font-semibold text-on-surface px-1">Settings</h2>

			<nav aria-label="Settings sections">
				<ul className="flex flex-col gap-1">
					{SETTINGS_NAV.map((entry) => {
						const isActive = entry.id === activeNavId;

						return (
							<li key={entry.id}>
								<button
									type="button"
									onClick={() => requestScrollTo(entry.id)}
									aria-current={isActive ? "true" : undefined}
									className={cn(
										"w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
										isActive
											? "bg-primary text-primary-foreground font-medium"
											: "text-secondary hover:bg-surface-container hover:text-on-surface",
									)}
								>
									{entry.label}
								</button>
							</li>
						);
					})}
				</ul>
			</nav>
		</BaseCard>
	);
}
