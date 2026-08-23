"use client";

import type { ClerkProfileScreen } from "@/lib/types/settings";
import { cn } from "@/lib/utils";
import { useClerkProfileScreen } from "../_hooks/use-clerk-profile-screen";

/**
 * The two screens `<UserProfile>` owns, and the fragment each one answers to.
 *
 * These hashes are Clerk's, not ours - `routing="hash"` means Clerk reads the
 * fragment to decide what to render, so this list is a description of Clerk's
 * behaviour rather than a decision we are making. Changing a value here would
 * not move Clerk anywhere; it would just stop the tab working.
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
 * Account / Security, as a segmented control on the card itself.
 *
 * ## Why this exists
 *
 * Clerk's own Profile/Security nav is hidden - it was a second menu for the two
 * destinations the app sidebar already lists, sitting in a column that made the
 * card three containers deep. Hiding it left Security reachable only from the
 * sidebar's Settings dropdown, which is a popover behind a collapsed rail:
 * nothing on the settings page itself said a Security screen existed.
 *
 * This puts that back in the one place it belongs to - on the card it switches -
 * rather than in a second navigation column beside it.
 *
 * ## Why links and not buttons
 *
 * Each tab genuinely navigates: it changes the fragment, which is where Clerk
 * keeps its state. Marking them up as links means the browser does the work,
 * `hashchange` fires exactly as it does when the sidebar writes the fragment,
 * and middle-click, bookmarking and the back button all behave the way anyone
 * would expect from something that looks like a link. Buttons calling
 * `location.hash = ...` would look identical and quietly break all three.
 *
 * `aria-current="page"` rather than the ARIA tab pattern, for the same reason:
 * these are links to two states of the page, and the tab pattern would promise a
 * `tabpanel` relationship to Clerk's markup that we do not control and cannot
 * wire up.
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
