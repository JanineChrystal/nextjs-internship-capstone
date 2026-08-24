/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import {
	toAttachmentDTO,
	toChecklistDTO,
	toTaskDTO,
	toTaskUI,
} from "@/lib/dtos/task-dto";

// Mock decryption since it's a separate utility
vi.mock("@/lib/utils/encryption", () => ({
	decrypt: vi.fn((text: string) => text),
}));

describe("toTaskDTO", () => {
	it("sanitises <> in name, notes, and category", () => {
		const dbTask: any = {
			name: "<script>alert('xss')</script> Title",
			notes: "Some <b>bold</b> notes",
			category: "<bad>",
		};
		const dto = toTaskDTO(dbTask);
		expect(dto.name).toBe("scriptalert('xss')/script Title");
		expect(dto.notes).toBe("Some bbold/b notes");
		expect(dto.category).toBe("bad");
	});

	it("passes through all fields correctly", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const dbTask: any = {
			id: "t1",
			projectId: "p1",
			boardId: "b1",
			position: 1,
			name: "Clean",
			category: "Work",
			isCompleted: false,
			status: "Not Started",
			statusOverriddenAt: null,
			previousBoardId: null,
			priority: "high",
			startDate: date,
			dueDate: date,
			notes: "Clean notes",
			createdAt: date,
			updatedAt: date,
		};
		const dto = toTaskDTO(dbTask);
		expect(dto).toEqual(dbTask);
	});
});

describe("toTaskUI", () => {
	it("builds a GridTask with derived fields", () => {
		const dto: any = {
			id: "t1",
			projectId: "p1",
			name: "Task",
			notes: "Notes",
			category: "Cat",
			isCompleted: true,
			status: "In Progress",
			dueDate: new Date("2026-01-01T00:00:00Z"),
			priority: "high",
		};
		const ui = toTaskUI(dto, "My Board", [], [], []);
		expect(ui.id).toBe("t1");
		expect(ui.status).toBe("Completed"); // Derived from isCompleted: true
		expect(ui.isOverdue).toBe(false);
		expect(ui.board).toBe("My Board");
	});
});

describe("toChecklistDTO", () => {
	it("decrypts title and sanitises text", () => {
		const dbItem: any = {
			id: "c1",
			taskId: "t1",
			title: "<test>",
			isCompleted: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const dto = toChecklistDTO(dbItem);
		expect(dto.title).toBe("test");
	});
});

describe("toAttachmentDTO", () => {
	it("passes through all fields", () => {
		const dbAtt: any = {
			id: "a1",
			taskId: "t1",
			name: "file.png",
			url: "http://example.com/file.png",
			type: "file",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const dto = toAttachmentDTO(dbAtt);
		expect(dto).toEqual(dbAtt);
	});
});

