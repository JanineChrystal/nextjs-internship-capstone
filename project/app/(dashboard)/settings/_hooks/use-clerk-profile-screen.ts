"use client";

import { useEffect, useState } from "react";
import type { ClerkProfileScreen } from "@/lib/types/settings";

/** The fragment Clerk uses for its Security screen. Its Profile screen is `#/`. */
const SECURITY_HASH = "#/security";

/**
 * Which of Clerk's own screens `<UserProfile>` is currently showing.
 *
 * Clerk's own Profile/Security nav is hidden, so `AccountScreenTabs` has to know
 * which of its two tabs to mark as current. Both the sidebar's Settings menu and
 * those tabs switch screens by writing the fragment that `routing="hash"` reads,
 * and this is how the tabs find out what the fragment now says.
 *
 * ## Why the fragment and not the settings store
 *
 * The store knows what was last clicked in the sidebar, which is not the same
 * question. Someone can arrive on `/settings#/security` from a bookmark or a
 * password-reset email having clicked nothing, and the store would still say
 * "account" - and a tab clicked on the card does not go through the store at
 * all. The fragment is what Clerk itself obeys, so reading it is the only answer
 * that cannot disagree with what is on screen.
 *
 * ## Why it starts on "account" rather than reading during render
 *
 * `window` does not exist while this renders on the server, and reading the
 * fragment in the first client render would produce different markup from the
 * server's and trip a hydration mismatch. The effect runs immediately after
 * mount, so a fragment-driven arrival corrects itself in the same frame the
 * panel appears - and "account" is the right guess anyway, because that is what
 * Clerk shows when the fragment is absent.
 *
 * The panel this drives is itself loaded with `ssr: false`, so in practice
 * nothing ever renders the fallback value on the server. The guard stays because
 * that is a property of how the section is imported, not of this hook, and the
 * next person to import it somewhere else should not have to know that.
 */
export function useClerkProfileScreen(): ClerkProfileScreen {
	const [screen, setScreen] = useState<ClerkProfileScreen>("account");

	useEffect(() => {
		const read = () => {
			setScreen(
				window.location.hash.startsWith(SECURITY_HASH) ? "security" : "account",
			);
		};

		read();

		// Assigning to `window.location.hash` fires this too, so a click in the
		// sidebar updates the heading through exactly the same path as someone
		// editing the address bar by hand.
		window.addEventListener("hashchange", read);
		return () => window.removeEventListener("hashchange", read);
	}, []);

	return screen;
}
