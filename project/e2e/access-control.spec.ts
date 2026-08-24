import { expect, test } from "@playwright/test";

/** critical flow - the guard, which is enforced at the data layer rather than by a route matcher, so asking is the only way to know. Runbook AUTH-03. */
test.describe("access control", () => {
	/** no stored session - this block drops the shared sign-in on purpose. */
	test.use({ storageState: { cookies: [], origins: [] } });

	const guarded = [
		"/dashboard",
		"/projects",
		"/team",
		"/analytics",
		"/archive",
		"/settings",
		"/calendar",
		"/notifications",
	];

	for (const path of guarded) {
		test(`redirects a signed-out visitor away from ${path}`, async ({
			page,
		}) => {
			await page.goto(path);

			/** asserts departure, not destination - Clerk's sign-in may sit on its own domain. */
			await expect(page).not.toHaveURL(new RegExp(`${path}$`));
			expect(page.url()).toMatch(/sign-in|sign-up|\/$/);
		});
	}

	test("serves the public landing page", async ({ page }) => {
		await page.goto("/");
		await expect(
			page.getByRole("navigation").getByText("Takda PH").first(),
		).toBeVisible();
	});
});
