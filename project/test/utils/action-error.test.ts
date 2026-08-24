import { describe, expect, it } from "vitest";
import { toUserFacingError } from "@/lib/utils/action-error";

const ALLOWED = ["Not found", "Unauthorized", "Already exists"] as const;

describe("toUserFacingError", () => {
	it("returns the generic message when the thrown value is not an Error", () => {
		expect(toUserFacingError("a string", ALLOWED)).toBe("An unexpected error occurred");
		expect(toUserFacingError(null, ALLOWED)).toBe("An unexpected error occurred");
		expect(toUserFacingError(42, ALLOWED)).toBe("An unexpected error occurred");
	});

	it("passes through an allowed message unchanged", () => {
		expect(toUserFacingError(new Error("Not found"), ALLOWED)).toBe("Not found");
		expect(toUserFacingError(new Error("Unauthorized"), ALLOWED)).toBe("Unauthorized");
	});

	it("returns the generic message for an unrecognised error message", () => {
		expect(toUserFacingError(new Error("Internal server error"), ALLOWED)).toBe(
			"An unexpected error occurred",
		);
	});

	it("applies an override when the message is in the override map", () => {
		const overrides = { Unauthorized: "You don't have permission to do that" };
		expect(toUserFacingError(new Error("Unauthorized"), ALLOWED, overrides)).toBe(
			"You don't have permission to do that",
		);
	});

	it("override takes priority over the allowed-list pass-through", () => {
		const overrides = { "Not found": "That item doesn't exist" };
		expect(toUserFacingError(new Error("Not found"), ALLOWED, overrides)).toBe(
			"That item doesn't exist",
		);
	});
});
