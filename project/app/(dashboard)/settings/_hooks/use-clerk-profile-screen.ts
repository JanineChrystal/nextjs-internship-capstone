"use client";

import { useEffect, useState } from "react";
import type { ClerkProfileScreen } from "@/lib/types/settings";

/** The fragment Clerk uses for its Security screen. Its Profile screen is `#/`. */
const SECURITY_HASH = "#/security";

/**
 * use-clerk-profile-screen hook - reads the current Clerk screen from the URL
 * fragment (the authoritative source) to sync custom tabs, defaulting to "account"
 * to avoid hydration mismatches during server-side rendering.
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

		// hashchange listener - captures fragment updates from sidebar clicks and manual URL edits identically.
		window.addEventListener("hashchange", read);
		return () => window.removeEventListener("hashchange", read);
	}, []);

	return screen;
}
