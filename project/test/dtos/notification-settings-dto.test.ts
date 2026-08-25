import { describe, expect, it } from "vitest";
import {
	DEFAULT_NOTIFICATION_SETTINGS,
	toNotificationSettingsDTO,
} from "@/lib/dtos/notification-settings-dto";

describe("toNotificationSettingsDTO", () => {
	it("maps boolean fields correctly", () => {
		const dbSettings = {
			id: "s1",
			userId: "u1",
			emailWorkspaceInvites: true,
			emailProjectInvites: false,
			emailCommentMentions: true,
			emailCommentViolations: false,
			emailProjectOverdue: true,
			emailTaskCompletions: false,
			emailProjectCompletions: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const dto = toNotificationSettingsDTO(
			dbSettings as unknown as Parameters<typeof toNotificationSettingsDTO>[0],
		);

		expect(dto).toEqual({
			emailWorkspaceInvites: true,
			emailProjectInvites: false,
			emailCommentMentions: true,
			emailCommentViolations: false,
			emailProjectOverdue: true,
			emailTaskCompletions: false,
			emailProjectCompletions: true,
		});
		expect("id" in dto).toBe(false);
	});
});

describe("DEFAULT_NOTIFICATION_SETTINGS", () => {
	it("has all fields set to true", () => {
		expect(
			Object.values(DEFAULT_NOTIFICATION_SETTINGS).every((v) => v === true),
		).toBe(true);
	});
});
