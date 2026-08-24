import { describe, expect, it } from "vitest";
import { BoardColumnSchema } from "@/lib/validations/board-schema";

describe("BoardColumnSchema", () => {
	const valid = {
		id: "col-1",
		title: "In Progress",
		dotColor: "#2b5bb5",
		order: 1,
	};

	it("accepts a column without isCompletionBoard", () => {
		/** optional flag - a project may not have designated a completion column. */
		expect(BoardColumnSchema.safeParse(valid).success).toBe(true);
	});

	it("accepts a column marked as the completion board", () => {
		expect(
			BoardColumnSchema.safeParse({ ...valid, isCompletionBoard: true })
				.success,
		).toBe(true);
	});

	it("requires a title", () => {
		const result = BoardColumnSchema.safeParse({ ...valid, title: "" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Column title is required");
		}
	});

	it("requires order to be a whole number", () => {
		/** integer order - a fractional value sorts fine and breaks anything indexing by it. */
		expect(BoardColumnSchema.safeParse({ ...valid, order: 1.5 }).success).toBe(
			false,
		);
	});

	it("rejects a missing dotColor", () => {
		const { dotColor, ...withoutColor } = valid;

		expect(BoardColumnSchema.safeParse(withoutColor).success).toBe(false);
	});
});
