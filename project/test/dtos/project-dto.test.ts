import { describe, expect, it } from "vitest";
import { toProjectDTO, toProjectUI } from "@/lib/dtos/project-dto";
import type { DbProject } from "@/lib/types/project";

describe("toProjectDTO", () => {
	it("maps all fields 1:1", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const dbProject: Partial<DbProject> = {
			id: "p1",
			workspaceId: "w1",
			ownerId: "u1",
			name: "Project 1",
			description: "Desc",
			status: "active",
			priority: "medium",
			category: "Cat",
			startDate: date,
			dueDate: date,
			createdAt: date,
			updatedAt: date,
		};
		expect(toProjectDTO(dbProject as unknown as DbProject)).toEqual(dbProject);
	});
});

describe("toProjectUI", () => {
	it("normalises invalid status to default 'active'", () => {
		const dto = { status: "unknown" };
		const ui = toProjectUI(dto as unknown as Parameters<typeof toProjectUI>[0]);
		expect(ui.status).toBe("active");
	});

	it("normalises invalid priority to default 'low'", () => {
		const dto = { priority: "critical", status: "active" };
		const ui = toProjectUI(dto as unknown as Parameters<typeof toProjectUI>[0]);
		expect(ui.priority).toBe("low");
	});

	it("calculates daysLeft, progress, and membersCount", () => {
		const now = new Date();
		const nextWeek = new Date(now);
		nextWeek.setDate(now.getDate() + 7);

		const dto = {
			status: "active",
			priority: "high",
			dueDate: nextWeek,
		};
		const stats = { taskCount: 10, completedTaskCount: 5, memberCount: 2 };
		const ui = toProjectUI(
			dto as unknown as Parameters<typeof toProjectUI>[0],
			"u1",
			stats,
		);

		expect(ui.daysLeft).toBeGreaterThanOrEqual(6);
		expect(ui.daysLeft).toBeLessThanOrEqual(7);
		expect(ui.progress).toBe(50); // 5 / 10
		expect(ui.membersCount).toBe(3); // memberCount + 1 (owner)
	});

	it("sets isOwned correctly based on currentUserId", () => {
		const dto = { ownerId: "u1", status: "active", priority: "high" };
		const isOwned = toProjectUI(
			dto as unknown as Parameters<typeof toProjectUI>[0],
			"u1",
		).isOwned;
		const notOwned = toProjectUI(
			dto as unknown as Parameters<typeof toProjectUI>[0],
			"u2",
		).isOwned;
		expect(isOwned).toBe(true);
		expect(notOwned).toBe(false);
	});

	it("defaults to isOwned=true if currentUserId is omitted", () => {
		const dto = { ownerId: "u1", status: "active", priority: "high" };
		expect(
			toProjectUI(dto as unknown as Parameters<typeof toProjectUI>[0]).isOwned,
		).toBe(true);
	});
});
