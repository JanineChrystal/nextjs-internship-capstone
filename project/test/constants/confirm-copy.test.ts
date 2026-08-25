import { describe, expect, it } from "vitest";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import { buildConfirmCopy } from "@/lib/constants/confirm-copy";

/** confirm copy - generates every confirmation sentence, so the count agreement and the delete consequence are what these pin. */
describe("buildConfirmCopy", () => {
	describe("singular", () => {
		it("names the subject with 'this' and no count", () => {
			const copy = buildConfirmCopy({ action: "delete", subject: "project" });

			expect(copy.title).toBe("Are you sure you want to delete this project?");
			expect(copy.confirmLabel).toBe("Delete");
		});

		it("uses the singular consequence", () => {
			const copy = buildConfirmCopy({ action: "delete", subject: "task" });

			expect(copy.description).toContain("It moves to the trash");
			expect(copy.description).not.toContain("They move");
		});
	});

	describe("bulk", () => {
		it("names the count and the plural in both the title and the button", () => {
			const copy = buildConfirmCopy({
				action: "delete",
				subject: "project",
				count: 3,
			});

			expect(copy.title).toBe("Are you sure you want to delete 3 projects?");
			/** button label - restates the action so a skimmed title cannot be pressed through. */
			expect(copy.confirmLabel).toBe("Delete 3 projects");
		});

		it("uses the plural consequence", () => {
			const copy = buildConfirmCopy({
				action: "delete",
				subject: "task",
				count: 2,
			});

			expect(copy.description).toContain("They move to the trash");
			expect(copy.description).not.toContain("It moves");
		});

		it("treats a count of one as singular", () => {
			/** count boundary - "delete 1 projects" is the wording this function replaced. */
			const copy = buildConfirmCopy({
				action: "delete",
				subject: "project",
				count: 1,
			});

			expect(copy.title).toBe("Are you sure you want to delete this project?");
			expect(copy.confirmLabel).toBe("Delete");
		});
	});

	describe("pluralisation", () => {
		it("uses subjectPlural when the plural is not a plain -s", () => {
			/** explicit plurals - English plurals are not computable, so "3 categorys" is the failure guarded against. */
			const copy = buildConfirmCopy({
				action: "delete",
				subject: "category",
				subjectPlural: "categories",
				count: 4,
			});

			expect(copy.title).toContain("4 categories");
			expect(copy.title).not.toContain("categorys");
		});
	});

	describe("consequences", () => {
		it("never claims a delete cannot be undone", () => {
			/** soft deletes - a deletedAt timestamp and a retention window make "permanent" untrue here. */
			const copy = buildConfirmCopy({ action: "delete", subject: "project" });

			expect(copy.description.toLowerCase()).not.toContain("cannot be undone");
		});

		it("interpolates the real retention window rather than a typed number", () => {
			const copy = buildConfirmCopy({ action: "delete", subject: "project" });

			expect(copy.description).toContain(String(TRASH_RETENTION_DAYS));
		});

		it("tells the reader an archive is reversible", () => {
			const copy = buildConfirmCopy({ action: "archive", subject: "project" });

			expect(copy.description).toContain("restore");
		});

		it("adds no consequence to a create, which has none", () => {
			/** no false alarms - warning on a create trains people to click through the dialog that mattered. */
			const copy = buildConfirmCopy({ action: "create", subject: "project" });

			expect(copy.description).toBe("");
		});

		it("lets the caller override the consequence", () => {
			const copy = buildConfirmCopy({
				action: "delete",
				subject: "task",
				consequence: "Some still have unchecked checklist items.",
			});

			expect(copy.description).toBe(
				"Some still have unchecked checklist items.",
			);
		});
	});

	describe("actions", () => {
		it("uses the right verb and button label for each action", () => {
			const cases = [
				["create", "create", "Create"],
				["edit", "save changes to", "Save changes"],
				["delete", "delete", "Delete"],
				["archive", "archive", "Archive"],
				["complete", "complete", "Complete"],
			] as const;

			for (const [action, verb, label] of cases) {
				const copy = buildConfirmCopy({ action, subject: "project" });

				expect(copy.title, `${action} title`).toBe(
					`Are you sure you want to ${verb} this project?`,
				);
				expect(copy.confirmLabel, `${action} label`).toBe(label);
			}
		});

		it("asks a question rather than announcing", () => {
			/** question form - a dialog with a Cancel button must not read as something the reader cannot refuse. */
			for (const action of [
				"create",
				"edit",
				"delete",
				"archive",
				"complete",
			] as const) {
				expect(
					buildConfirmCopy({ action, subject: "project" }).title.endsWith("?"),
					action,
				).toBe(true);
			}
		});
	});
});
