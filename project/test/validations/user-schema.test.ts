import { describe, expect, it } from "vitest";
import { changePasswordSchema, userSchema } from "@/lib/validations/user-schema";

describe("userSchema", () => {
	it("rejects non-gmail emails", () => {
		const result = userSchema.safeParse({
			email: "test@example.com",
			password: "Password123!",
		});
		expect(result.success).toBe(false);
	});

	it("accepts gmail emails and valid passwords", () => {
		const result = userSchema.safeParse({
			email: "test@gmail.com",
			password: "Password123!",
		});
		expect(result.success).toBe(true);
	});

	it("requires min 8 char password", () => {
		const result = userSchema.safeParse({
			email: "test@gmail.com",
			password: "short",
		});
		expect(result.success).toBe(false);
	});
});

describe("changePasswordSchema", () => {
	const validPayload = {
		currentPassword: "OldPassword1!",
		newPassword: "NewPassword123!",
		confirmPassword: "NewPassword123!",
	};

	it("accepts valid passwords that match", () => {
		expect(changePasswordSchema.safeParse(validPayload).success).toBe(true);
	});

	it("rejects when passwords do not match", () => {
		expect(
			changePasswordSchema.safeParse({
				...validPayload,
				confirmPassword: "DifferentPassword123!",
			}).success,
		).toBe(false);
	});

	it("requires uppercase, lowercase, number, and special char in new password", () => {
		const testCases = [
			"alllowercase123!", // no uppercase
			"ALLUPPERCASE123!", // no lowercase
			"NoNumbersHere!", // no numbers
			"NoSpecialChars123", // no special chars
		];

		for (const pwd of testCases) {
			expect(
				changePasswordSchema.safeParse({
					currentPassword: "OldPassword1!",
					newPassword: pwd,
					confirmPassword: pwd,
				}).success,
			).toBe(false);
		}
	});
});
