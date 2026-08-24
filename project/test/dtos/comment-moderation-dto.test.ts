import { describe, expect, it, vi } from "vitest";
import { FLAGGED_SNIPPET_LENGTH } from "@/lib/constants/profanity";
import { toFlaggedCommentDTO } from "@/lib/dtos/comment-moderation-dto";

vi.mock("@/lib/utils/encryption", () => ({
	decrypt: vi.fn((text: string) => text),
}));

describe("toFlaggedCommentDTO", () => {
	const baseRow = {
		commentId: "c1",
		taskId: "t1",
		taskTitle: "Task",
		authorId: "a1",
		firstName: "Alice",
		lastName: "Smith",
		email: "alice@example.com",
		imageUrl: null,
		flagReason: null,
		createdAt: new Date(),
	};

	it("truncates body at FLAGGED_SNIPPET_LENGTH", () => {
		const longBody = "A".repeat(FLAGGED_SNIPPET_LENGTH + 50);
		const dto = toFlaggedCommentDTO({ ...baseRow, body: longBody });
		expect(dto.commentSnippet.length).toBe(FLAGGED_SNIPPET_LENGTH + 3); // +3 for '...'
		expect(dto.commentSnippet.endsWith("...")).toBe(true);
	});

	it("does not truncate short bodies", () => {
		const shortBody = "Short";
		const dto = toFlaggedCommentDTO({ ...baseRow, body: shortBody });
		expect(dto.commentSnippet).toBe("Short");
	});

	it("builds author name with fallback to email", () => {
		const dto = toFlaggedCommentDTO({ ...baseRow, body: "text" });
		expect(dto.authorName).toBe("Alice Smith");

		const noName = toFlaggedCommentDTO({
			...baseRow,
			firstName: null,
			lastName: null,
			body: "text",
		});
		expect(noName.authorName).toBe("alice@example.com");
	});

	it("defaults flagReason to 'Flagged'", () => {
		const dto = toFlaggedCommentDTO({ ...baseRow, body: "text" });
		expect(dto.flagReason).toBe("Flagged");

		const specific = toFlaggedCommentDTO({
			...baseRow,
			body: "text",
			flagReason: "English profanity",
		});
		expect(specific.flagReason).toBe("English profanity");
	});
});
