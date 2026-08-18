"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk/appearance";
import { SettingsSection } from "./settings-section";

/**
 * Account and Security, served by one Clerk panel.
 *
 * Clerk's `<UserProfile>` owns both screens and cannot be mounted twice, so the
 * sidebar's Account and Security entries both scroll here and differ only in
 * which of Clerk's own screens they ask for - see lib/constants/settings-nav.ts.
 * Clerk's internal Profile/Security nav is left visible rather than hidden, so
 * the relationship is obvious to anyone who scrolls here without using our menu.
 *
 * `routing="hash"` is what makes that switch possible: Clerk reads its current
 * screen from the URL fragment, which is also why nothing else on this page uses
 * the fragment for its own anchors.
 */
export function AccountSection() {
	return (
		<SettingsSection
			id="settings-account"
			title="Account & Security"
			description="Your profile, email addresses, password and active devices. Managed by Clerk and styled to match the rest of the app."
		>
			<div className="overflow-hidden rounded-lg border border-border">
				<UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
			</div>
		</SettingsSection>
	);
}
