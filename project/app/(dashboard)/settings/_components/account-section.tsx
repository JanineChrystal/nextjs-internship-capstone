"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk/appearance";
import { AccountScreenTabs } from "./account-screen-tabs";
import { SettingsSection } from "./settings-section";

/**
 * account section component - provides a unified Clerk UserProfile panel for both
 * Account and Security screens, managed via hash routing and integrated tabs
 * to replace Clerk's native deep navigation.
 */
export function AccountSection() {
	return (
		<SettingsSection
			id="settings-account"
			title="Account & Security"
			description="Your profile, email addresses, password and active devices. Managed by Clerk and styled to match the rest of the app."
		>
			<AccountScreenTabs />

			{/* structural flattening - renders the UserProfile as a bare child to prevent redundant nesting after stripping Clerk's native chrome. */}
			<UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
		</SettingsSection>
	);
}
