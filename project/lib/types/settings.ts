/** One entry in the Settings sub-menu. */
export type SettingsNavId =
	| "account"
	| "security"
	| "notifications"
	| "appearance";

/**
 * One scrollable card on the Settings page.
 *
 * Fewer of these than there are menu entries, because Account and Security are
 * both served by the single Clerk panel - see lib/constants/settings-nav.ts.
 */
export type SettingsSectionDomId =
	| "settings-account"
	| "settings-notifications"
	| "settings-appearance";

/**
 * Which screen Clerk's `<UserProfile>` is showing.
 *
 * A narrower type than `SettingsNavId` on purpose: those four are our menu
 * entries, and only two of them are screens Clerk owns. Reusing the wider type
 * would let `"appearance"` be passed to something that can only ever answer
 * Profile or Security.
 */
export type ClerkProfileScreen = "account" | "security";
