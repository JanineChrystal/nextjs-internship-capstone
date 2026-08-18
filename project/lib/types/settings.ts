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
