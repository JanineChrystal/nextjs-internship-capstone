import type { SettingsNavId, SettingsSectionDomId } from "@/lib/types/settings";

/**
 * settings navigation entries - centralizes the configuration for the
 * settings sub-menu, mapping logical entries to DOM targets and Clerk
 * URL fragments to align the sidebar, scroll spy, and the Clerk UI
 * component.
 */
export interface SettingsNavEntry {
	id: SettingsNavId;
	label: string;
	description: string;
	domId: SettingsSectionDomId;
	clerkHash?: string;
}

export const SETTINGS_NAV: SettingsNavEntry[] = [
	{
		id: "account",
		label: "Account",
		description: "Your profile, email addresses and connected accounts.",
		domId: "settings-account",
		clerkHash: "#/",
	},
	{
		id: "security",
		label: "Security",
		description: "Password, active devices and account deletion.",
		domId: "settings-account",
		clerkHash: "#/security",
	},
	{
		id: "notifications",
		label: "Notifications",
		description: "Choose which emails you want to receive.",
		domId: "settings-notifications",
	},
	{
		id: "appearance",
		label: "Appearance",
		description: "Pick the colour theme the app uses.",
		domId: "settings-appearance",
	},
];

/** settings section dom ids - enumerates the distinct DOM IDs actively observed by the scroll spy. */
export const SETTINGS_SECTION_DOM_IDS: SettingsSectionDomId[] = [
	"settings-account",
	"settings-notifications",
	"settings-appearance",
];

export function toNavEntry(id: SettingsNavId): SettingsNavEntry {
	const entry = SETTINGS_NAV.find((item) => item.id === id);
	if (!entry) throw new Error(`Unknown settings nav id: ${id}`);
	return entry;
}

/**
 * to default nav id - resolves a DOM section to its primary menu entry
 * ID, defaulting to Account for shared sections since that matches
 * Clerk's default view.
 */
export function toDefaultNavId(domId: SettingsSectionDomId): SettingsNavId {
	const entry = SETTINGS_NAV.find((item) => item.domId === domId);
	if (!entry) throw new Error(`Unknown settings section: ${domId}`);
	return entry.id;
}
