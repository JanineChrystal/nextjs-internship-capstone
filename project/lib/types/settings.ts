/** settings nav id - defines a single entry in the settings sub-menu. */
export type SettingsNavId =
	| "account"
	| "security"
	| "notifications"
	| "appearance";

/**
 * settings section dom id - defines the allowed scrollable section targets
 * on the settings page, uniquely mapping to clerk and custom sections.
 */
export type SettingsSectionDomId =
	| "settings-account"
	| "settings-notifications"
	| "settings-appearance";

/**
 * clerk profile screen - constrains the views available within Clerk's
 * UserProfile component to prevent passing invalid views like 'appearance'.
 */
export type ClerkProfileScreen = "account" | "security";
