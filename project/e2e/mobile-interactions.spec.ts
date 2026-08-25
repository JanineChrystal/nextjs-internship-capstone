import { expect, test } from "@playwright/test";

/** critical flow - the touch-only behaviours, run against a real device profile because a narrow desktop window reports pointer:fine and would pass regardless. Runbook MOB-01, MOB-03. */
test.describe("mobile interactions", () => {
	test("shows every project view tab without clipping", async ({
		page,
	}, testInfo) => {
		test.skip(testInfo.project.name !== "mobile", "touch-specific behaviour");
		await page.goto("/projects");

		const firstProject = page.locator('a[href^="/projects/"]').first();
		await expect(firstProject).toBeVisible();
		await firstProject.click();
		await page.waitForURL(/\/projects\/[0-9a-f-]{36}/);

		const viewport = page.viewportSize();
		if (!viewport) throw new Error("expected a viewport");

		/** measured, not just visible - the strip scrolled, so a clipped tab still counted as visible while being cut in half. */
		for (const label of ["Grid", "Board", "Calendar", "Charts"]) {
			const tab = page.getByRole("button", { name: label, exact: true });
			await expect(tab).toBeVisible();

			const box = await tab.boundingBox();
			expect(box, `${label} tab should have a box`).not.toBeNull();
			if (box) {
				expect(
					box.x + box.width,
					`${label} tab should end inside the viewport`,
				).toBeLessThanOrEqual(viewport.width);
			}
		}
	});

	test("filters the side panel by tapping a calendar day", async ({
		page,
	}, testInfo) => {
		test.skip(testInfo.project.name !== "mobile", "touch-specific behaviour");
		await page.goto("/calendar");

		/** day backgrounds - tapping one did nothing before, since slot selection needs a 250ms long press on touch. */
		const dayCells = page.locator(".rbc-day-bg");
		await expect(dayCells.first()).toBeVisible();

		const sidePanel = page.getByRole("complementary").first();
		const before = await sidePanel.innerText().catch(() => "");

		/** mid-month - so the tap lands on this month rather than a greyed neighbour. */
		await dayCells.nth(15).tap();

		/** asserts a change, not a value - naming an item would tie the test to seed data. */
		await expect
			.poll(async () => sidePanel.innerText().catch(() => ""), {
				timeout: 10_000,
			})
			.not.toBe(before);
	});
});
