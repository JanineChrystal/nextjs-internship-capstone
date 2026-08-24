import { describe, expect, it, vi } from "vitest";
import { toActivityLogDTO, toNotificationDTO } from "@/lib/dtos/activity-dto";
import type { DbActivityLog, DbNotification } from "@/lib/types/activity";

/** decrypt stub - mocks the dependency, not the module under test, prefixed so decrypted fields are distinguishable from passed-through ones. */
vi.mock("@/lib/utils/encryption", () => ({
	decrypt: vi.fn((value: string | null) =>
		value === null ? null : `decrypted:${value}`,
	),
}));

const now = new Date("2026-08-24T10:00:00.000Z");

describe("toActivityLogDTO", () => {
	const row = {
		id: "log-1",
		workspaceId: "ws-1",
		projectId: "proj-1",
		taskId: "task-1",
		actorId: "user-1",
		targetUserId: "user-2",
		actionType: "TASK_COMPLETED",
		details: "ciphertext",
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
	} as unknown as DbActivityLog;

	it("decrypts the details field", () => {
		expect(toActivityLogDTO(row).details).toBe("decrypted:ciphertext");
	});

	it("passes a null details through without decrypting", () => {
		const dto = toActivityLogDTO({ ...row, details: null } as DbActivityLog);

		expect(dto.details).toBeNull();
	});

	it("carries every identifier through unchanged", () => {
		/** identifiers stay plain - the app matches and searches on them, so a "decrypted:" prefix here means the policy regressed. */
		const dto = toActivityLogDTO(row);

		expect(dto.id).toBe("log-1");
		expect(dto.workspaceId).toBe("ws-1");
		expect(dto.projectId).toBe("proj-1");
		expect(dto.taskId).toBe("task-1");
		expect(dto.actorId).toBe("user-1");
		expect(dto.targetUserId).toBe("user-2");
		expect(dto.actionType).toBe("TASK_COMPLETED");
	});

	it("exposes exactly the DTO's fields and no more", () => {
		/** field allow-list - deletedAt is on the row and must not survive the mapping. */
		expect(Object.keys(toActivityLogDTO(row)).sort()).toEqual(
			[
				"actionType",
				"actorId",
				"createdAt",
				"details",
				"id",
				"projectId",
				"targetUserId",
				"taskId",
				"updatedAt",
				"workspaceId",
			].sort(),
		);
		expect(toActivityLogDTO(row)).not.toHaveProperty("deletedAt");
	});

	it("preserves the timestamps as Date objects", () => {
		const dto = toActivityLogDTO(row);

		expect(dto.createdAt).toBeInstanceOf(Date);
		expect(dto.createdAt.toISOString()).toBe(now.toISOString());
	});
});

describe("toNotificationDTO", () => {
	const row = {
		id: "note-1",
		recipientId: "user-1",
		actorId: "user-2",
		workspaceId: "ws-1",
		projectId: null,
		taskId: null,
		actionType: "COMMENT_ADDED",
		message: "Alice mentioned you",
		isRead: false,
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
	} as unknown as DbNotification;

	it("passes the message through without decrypting it", () => {
		/** no double-handling - messages are decrypted upstream in the DAL, and decrypting twice yields mojibake rather than an error. */
		expect(toNotificationDTO(row).message).toBe("Alice mentioned you");
	});

	it("preserves isRead as a boolean, including false", () => {
		/** false is meaningful - a truthiness check would behave identically here and differently for a null column. */
		expect(toNotificationDTO(row).isRead).toBe(false);
		expect(
			toNotificationDTO({ ...row, isRead: true } as DbNotification).isRead,
		).toBe(true);
	});

	it("carries nullable scope ids through as null", () => {
		const dto = toNotificationDTO(row);

		expect(dto.projectId).toBeNull();
		expect(dto.taskId).toBeNull();
	});

	it("drops fields that are not on the DTO", () => {
		expect(toNotificationDTO(row)).not.toHaveProperty("deletedAt");
	});
});
