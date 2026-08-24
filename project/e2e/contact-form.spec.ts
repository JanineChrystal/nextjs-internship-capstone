import { expect, test } from "@playwright/test";

/** contact form - the only endpoint a stranger can reach, and the one place validation is worth asserting end to end. Runbook CNT-02, CNT-05, CNT-06. */
test.describe("contact form", () => {
	/** public page - no stored session, so this also proves the drawer works signed out. */
	test.use({ storageState: { cookies: [], origins: [] } });

	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Contact us" }).first().click();
		await expect(page.getByLabel("Name")).toBeVisible();
	});

	test("refuses an empty submission with a message per field", async ({
		page,
	}) => {
		await page.getByRole("button", { name: "Send message" }).click();

		await expect(page.getByText("Please tell us your name")).toBeVisible();
		await expect(page.getByText("Please enter an email address")).toBeVisible();
		await expect(
			page.getByText("Please write at least 10 characters"),
		).toBeVisible();
	});

	test("rejects a malformed email", async ({ page }) => {
		await page.getByLabel("Name").fill("Juan dela Cruz");
		await page.getByLabel("Email").fill("not-an-email");
		await page.getByLabel("Message").fill("This is a long enough message.");

		await page.getByRole("button", { name: "Send message" }).click();

		await expect(
			page.getByText("Please enter a valid email address"),
		).toBeVisible();
	});

	test("rejects a message under ten characters", async ({ page }) => {
		await page.getByLabel("Name").fill("Juan dela Cruz");
		await page.getByLabel("Email").fill("juan@example.com");
		await page.getByLabel("Message").fill("short");

		await page.getByRole("button", { name: "Send message" }).click();

		await expect(
			page.getByText("Please write at least 10 characters"),
		).toBeVisible();
	});

	test("keeps the honeypot away from a person", async ({ page }) => {
		const honeypot = page.locator("#contact-website");

		/** present but unreachable - it exists in the DOM, is hidden from assistive tech, and is skipped by tabbing. */
		await expect(honeypot).toHaveCount(1);
		await expect(honeypot).not.toBeVisible();
		await expect(honeypot).toHaveAttribute("tabindex", "-1");

		await page.getByLabel("Name").focus();
		for (let step = 0; step < 8; step++) {
			await page.keyboard.press("Tab");
			const focusedId = await page.evaluate(
				() => document.activeElement?.id ?? "",
			);
			expect(focusedId).not.toBe("contact-website");
		}
	});
});
