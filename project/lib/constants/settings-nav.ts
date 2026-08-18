import type { SettingsNavId, SettingsSectionDomId } from "@/lib/types/settings";

/**
 * The four entries in the Settings sub-menu, and which part of the page each
 * one points at.
 *
 * This lives in lib/constants rather than beside the settings page because
 * three unrelated places need it: the sidebar renders it, the settings page
 * anchors its sections to it, and the shared store resolves scroll positions
 * with it. A constant that three modules read cannot live inside one of them.
 *
 * Note that Account and Security share a `domId`. They are two entries in our
 * menu but one component on the page: Clerk's `<UserProfile>` renders both its
 * Profile and its Security screens itself and cannot be mounted twice, so the
 * two entries scroll to the same card and differ only in which of Clerk's own
 * screens they ask for. `clerkHash` is what does the asking - `routing="hash"`
 * means Clerk reads its current screen straight off the URL fragment.
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

/** The DOM sections the scroll-spy actually observes - three, not four. */
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
 * The first menu entry belonging to a section.
 *
 * "First" matters because of the Account/Security pair: when the user scrolls
 * that card into view without having clicked anything, Account is the honest
 * answer - Clerk opens on its Profile screen by default.
 */
export function toDefaultNavId(domId: SettingsSectionDomId): SettingsNavId {
	const entry = SETTINGS_NAV.find((item) => item.domId === domId);
	if (!entry) throw new Error(`Unknown settings section: ${domId}`);
	return entry.id;
}
