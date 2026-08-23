"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk/appearance";
import { AccountScreenTabs } from "./account-screen-tabs";
import { SettingsSection } from "./settings-section";

/**
 * Account and Security, served by one Clerk panel.
 *
 * `<UserProfile>` owns both screens and cannot usefully be mounted twice: with
 * `routing="hash"` the fragment *is* its state, and a document has one fragment,
 * so two mounts could never disagree about which screen they were showing. Two
 * cards would render the same content twice. That is why both entries in the
 * sidebar's Settings menu point at this one section and differ only in the
 * fragment they set - see lib/constants/settings-nav.ts.
 *
 * Clerk's internal Profile/Security nav used to be left visible so that
 * relationship was obvious to anyone who scrolled here without using our menu.
 * It is hidden now: it was a second menu for two destinations our sidebar
 * already lists, and it sat in a column that made this card three containers
 * deep. `AccountScreenTabs` puts the switch back on the card itself, which is
 * one control in the place it acts on rather than two in different places.
 */
export function AccountSection() {
	return (
		<SettingsSection
			id="settings-account"
			title="Account & Security"
			description="Your profile, email addresses, password and active devices. Managed by Clerk and styled to match the rest of the app."
		>
			<AccountScreenTabs />

			{/* Deliberately unwrapped. A bordered div here was the third container
			    around the same content - our card, this border, and Clerk's own card
			    chrome - which reads as a rendering bug rather than as depth. Clerk's
			    chrome is stripped in lib/clerk/appearance.ts and this is now a bare
			    child of the section. */}
			<UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
		</SettingsSection>
	);
}
