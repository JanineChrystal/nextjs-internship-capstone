import { describe, expect, it } from "vitest";
import {
	SETTINGS_NAV,
	SETTINGS_SECTION_DOM_IDS,
	toDefaultNavId,
	toNavEntry,
} from "@/lib/constants/settings-nav";
import type { SettingsNavId } from "@/lib/types/settings";

/** settings nav - three modules read these lookups, and both throw on an unknown id rather than falling back. */
describe("SETTINGS_NAV", () => {
	it("has a unique id per entry", () => {
		const ids = SETTINGS_NAV.map((entry) => entry.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("points every entry at a section the scroll-spy observes", () => {
		/** dangling entries - a domId outside this list would scroll nowhere and never highlight. */
		for (const entry of SETTINGS_NAV) {
			expect(SETTINGS_SECTION_DOM_IDS, entry.id).toContain(entry.domId);
		}
	});

	it("has fewer sections than entries, because Account and Security share one", () => {
		/** shared card - Clerk's UserProfile owns both screens and cannot be mounted twice. */
		expect(SETTINGS_SECTION_DOM_IDS.length).toBeLessThan(SETTINGS_NAV.length);
	});

	it("gives Account and Security the same section but different Clerk screens", () => {
		const account = toNavEntry("account");
		const security = toNavEntry("security");

		expect(account.domId).toBe(security.domId);
		expect(account.clerkHash).not.toBe(security.clerkHash);
	});

	it("carries a Clerk hash only for the entries Clerk owns", () => {
		for (const entry of SETTINGS_NAV) {
			const isClerkScreen = entry.id === "account" || entry.id === "security";
			expect(Boolean(entry.clerkHash), entry.id).toBe(isClerkScreen);
		}
	});
});

describe("toNavEntry", () => {
	it("returns the entry for every known id", () => {
		for (const entry of SETTINGS_NAV) {
			expect(toNavEntry(entry.id).id).toBe(entry.id);
		}
	});

	it("throws on an unknown id rather than returning a fallback", () => {
		expect(() => toNavEntry("nonexistent" as SettingsNavId)).toThrow(
			/Unknown settings nav id/,
		);
	});
});

describe("toDefaultNavId", () => {
	it("resolves each section to a real nav id", () => {
		for (const domId of SETTINGS_SECTION_DOM_IDS) {
			const navId = toDefaultNavId(domId);

			expect(SETTINGS_NAV.map((entry) => entry.id)).toContain(navId);
		}
	});

	it("resolves the shared card to Account, not Security", () => {
		/** first entry wins - Clerk opens on its Profile screen, so Account is the honest default. */
		expect(toDefaultNavId("settings-account")).toBe("account");
	});

	it("throws on an unknown section", () => {
		expect(() =>
			toDefaultNavId(
				"settings-nonexistent" as (typeof SETTINGS_SECTION_DOM_IDS)[number],
			),
		).toThrow(/Unknown settings section/);
	});
});
