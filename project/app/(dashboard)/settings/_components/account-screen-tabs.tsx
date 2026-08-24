"use client";

import type { ClerkProfileScreen } from "@/lib/types/settings";
import { cn } from "@/lib/utils";
import { useClerkProfileScreen } from "../_hooks/use-clerk-profile-screen";

/**
 * clerk screen hashes - maps Clerk's internal routing fragments to screen labels,
 * matching their predefined hashes since Clerk drives the actual navigation.
 */
const SCREEN_TABS: {
	screen: ClerkProfileScreen;
	label: string;
	hash: string;
}[] = [
	{ screen: "account", label: "Account", hash: "#/" },
	{ screen: "security", label: "Security", hash: "#/security" },
];

/**
 * account screen tabs - provides a segmented control for navigating Clerk's
 * sub-screens, utilizing native anchor links for proper browser history
 * management instead of the ARIA tab pattern since Clerk controls the panels.
 */
export function AccountScreenTabs() {
	const active = useClerkProfileScreen();

	return (
		<nav aria-label="Account sections">
			<ul className="inline-flex items-center gap-1 rounded-lg bg-surface-container p-1">
				{SCREEN_TABS.map((tab) => {
					const isActive = tab.screen === active;

					return (
						<li key={tab.screen}>
							<a
								href={tab.hash}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"block rounded-md px-3 py-1.5 text-sm transition-colors",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									isActive
										? "bg-card font-medium text-on-surface shadow-sm"
										: "text-secondary hover:text-on-surface",
								)}
							>
								{tab.label}
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
