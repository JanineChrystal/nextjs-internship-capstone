import { describe, expect, it } from "vitest";
import { updateNotificationSettingsSchema } from "@/lib/validations/notification-settings-schema";

describe("updateNotificationSettingsSchema", () => {
	it("accepts partial booleans", () => {
		expect(
			updateNotificationSettingsSchema.safeParse({
				emailWorkspaceInvites: false,
			}).success,
		).toBe(true);

		expect(
			updateNotificationSettingsSchema.safeParse({
				emailProjectCompletions: true,
				emailTaskCompletions: false,
			}).success,
		).toBe(true);
	});

	it("rejects non-boolean values", () => {
		expect(
			updateNotificationSettingsSchema.safeParse({
				emailWorkspaceInvites: "true",
			}).success,
		).toBe(false);
	});

	it("rejects unknown keys", () => {
		expect(
			updateNotificationSettingsSchema.safeParse({
				emailWorkspaceInvites: true,
				userId: "u1", // strict() should reject this
			}).success,
		).toBe(false);

		expect(
			updateNotificationSettingsSchema.safeParse({
				id: "s1",
			}).success,
		).toBe(false);
	});
});
