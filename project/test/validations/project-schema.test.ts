import { describe, expect, it } from "vitest";
import {
	createProjectSchema,
	editProjectSchema,
	projectSchema,
} from "@/lib/validations/project-schema";

/** relative dates - keeps these cases from expiring as the calendar moves past a hard-coded year. */
function isoDaysFromNow(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString();
}

describe("projectSchema", () => {
	const valid = {
		id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
		title: "Takda PH",
		isOwned: true,
		isAssigned: false,
	};

	it("accepts the minimum viable project", () => {
		expect(projectSchema.safeParse(valid).success).toBe(true);
	});

	it("requires a title", () => {
		expect(projectSchema.safeParse({ ...valid, title: "" }).success).toBe(
			false,
		);
	});

	it("requires a uuid id", () => {
		expect(projectSchema.safeParse({ ...valid, id: "1" }).success).toBe(false);
	});

	it("rejects a progress outside 0-100", () => {
		expect(projectSchema.safeParse({ ...valid, progress: 101 }).success).toBe(
			false,
		);
		expect(projectSchema.safeParse({ ...valid, progress: -1 }).success).toBe(
			false,
		);
		expect(projectSchema.safeParse({ ...valid, progress: 100 }).success).toBe(
			true,
		);
	});

	it("rejects negative or fractional counts", () => {
		expect(projectSchema.safeParse({ ...valid, tasksCount: -1 }).success).toBe(
			false,
		);
		expect(projectSchema.safeParse({ ...valid, tasksCount: 1.5 }).success).toBe(
			false,
		);
	});

	it("rejects a status outside the enum", () => {
		/** deletion is not a status - it is carried by deletedAt, and a second source of truth would drift. */
		expect(
			projectSchema.safeParse({ ...valid, status: "deleted" }).success,
		).toBe(false);
	});
});

/** create/edit asymmetry - both share addScheduleRules, but only create passes enforceNotPast, and that flag is easily "tidied" into consistency. */
describe("createProjectSchema", () => {
	it("accepts a project starting today and due later", () => {
		const result = createProjectSchema.safeParse({
			title: "Takda PH",
			startDate: isoDaysFromNow(0),
			dueDate: isoDaysFromNow(30),
		});

		expect(result.success).toBe(true);
	});

	it("rejects a start date in the past", () => {
		const result = createProjectSchema.safeParse({
			title: "Takda PH",
			startDate: isoDaysFromNow(-7),
			dueDate: isoDaysFromNow(30),
		});

		expect(result.success).toBe(false);
	});

	it("rejects a due date before the start date", () => {
		const result = createProjectSchema.safeParse({
			title: "Takda PH",
			startDate: isoDaysFromNow(30),
			dueDate: isoDaysFromNow(7),
		});

		expect(result.success).toBe(false);
	});

	it("requires a title", () => {
		expect(createProjectSchema.safeParse({ title: "" }).success).toBe(false);
	});
});

describe("editProjectSchema", () => {
	it("allows a past start date, so a running project stays editable", () => {
		/** the asymmetry - enforcing not-in-the-past here would make every older project uneditable, showing up only as a form that will not save. */
		const result = editProjectSchema.safeParse({
			title: "Takda PH",
			startDate: isoDaysFromNow(-30),
			dueDate: isoDaysFromNow(30),
		});

		expect(result.success).toBe(true);
	});

	it("still rejects a due date before the start date", () => {
		/** ordering survives - relaxing the past rule does not relax this one. */
		const result = editProjectSchema.safeParse({
			startDate: isoDaysFromNow(-7),
			dueDate: isoDaysFromNow(-30),
		});

		expect(result.success).toBe(false);
	});

	it("accepts an empty object, because every field is optional", () => {
		expect(editProjectSchema.safeParse({}).success).toBe(true);
	});

	it("still enforces the title rule when a title is given", () => {
		expect(editProjectSchema.safeParse({ title: "" }).success).toBe(false);
	});
});
