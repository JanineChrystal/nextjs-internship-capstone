/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { toCommentDTO } from "@/lib/dtos/comment-dto";

vi.mock("@/lib/utils/encryption", () => ({
	decrypt: vi.fn((text: string) => text),
}));

describe("toCommentDTO", () => {
	const author = {
		firstName: "Alice",
		lastName: "Smith",
		email: "alice@example.com",
		imageUrl: "http://example.com/avatar.png",
	};

	it("sanitises body text", () => {
		const dbComment: any = {
			deletedAt: null,
			isFlagged: false,
			moderatedAt: null,
			moderatedById: null,
			body: "Hello <b>world</b>",
		};
		const dto = toCommentDTO(dbComment, author);
		expect(dto.body).toBe("Hello bworld/b");
	});

	it("withholds body when deleted", () => {
		const dbComment: any = {
			deletedAt: new Date(),
			isFlagged: false,
			moderatedAt: null,
			moderatedById: null,
			body: "Secret",
		};
		const dto = toCommentDTO(dbComment, author);
		expect(dto.body).toBe("");
		expect(dto.isDeleted).toBe(true);
	});

	it("withholds body when under review (flagged but not moderated)", () => {
		const dbComment: any = {
			deletedAt: null,
			isFlagged: true,
			moderatedAt: null,
			moderatedById: null,
			body: "Secret",
		};
		const dto = toCommentDTO(dbComment, author);
		expect(dto.body).toBe("");
		expect(dto.isUnderReview).toBe(true);
	});

	it("exposes body when flagged and moderated (approved)", () => {
		const dbComment: any = {
			deletedAt: null,
			isFlagged: true,
			moderatedAt: new Date(), // It was reviewed and left standing
			moderatedById: "u1",
			body: "Okay text",
		};
		const dto = toCommentDTO(dbComment, author);
		expect(dto.body).toBe("Okay text");
		expect(dto.isUnderReview).toBe(false);
	});

	it("derives isRejected when deleted and moderatedById is present", () => {
		const dbComment: any = {
			deletedAt: new Date(),
			isFlagged: true,
			moderatedAt: new Date(),
			moderatedById: "u1", // A moderator did this
			body: "Bad text",
		};
		const dto = toCommentDTO(dbComment, author);
		expect(dto.isRejected).toBe(true);
	});

	it("builds author name with fallback to email", () => {
		const dbComment: any = { deletedAt: null, isFlagged: false, body: "text" };
		const withName = toCommentDTO(dbComment, author);
		expect(withName.authorName).toBe("Alice Smith");

		const noName = toCommentDTO(dbComment, {
			firstName: null,
			lastName: null,
			email: "bob@example.com",
			imageUrl: null,
		});
		expect(noName.authorName).toBe("bob@example.com");
	});
});

