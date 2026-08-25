import { expect, test } from "@playwright/test";

/** contact form - the only endpoint a stranger can reach, and the one place validation is worth asserting end to end. Runbook CNT-02, CNT-05, CNT-06. */
test.describe("contact form", () => {
	/** public page - no stored session, so this also proves the drawer works signed out. */
	test.use({ storageState: { cookies: [], origins: [] } });

	/** by id, not by label - "Email" also matches the field's own placeholder wiring, so a label lookup is not unique inside the drawer. */
	const NAME = "#contact-name";
	const EMAIL = "#contact-email";
	const MESSAGE = "#contact-message";

	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Contact us" }).first().click();
		await expect(page.locator(NAME)).toBeVisible();
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
		await page.locator(NAME).fill("Juan dela Cruz");
		await page.locator(EMAIL).fill("not-an-email");
		await page.locator(MESSAGE).fill("This is a long enough message.");

		await page.getByRole("button", { name: "Send message" }).click();

		await expect(
			page.getByText("Please enter a valid email address"),
		).toBeVisible();
	});

	test("rejects a message under ten characters", async ({ page }) => {
		await page.locator(NAME).fill("Juan dela Cruz");
		await page.locator(EMAIL).fill("juan@example.com");
		await page.locator(MESSAGE).fill("short");

		await page.getByRole("button", { name: "Send message" }).click();

		await expect(
			page.getByText("Please write at least 10 characters"),
		).toBeVisible();
	});

	test("keeps the honeypot away from a person", async ({ page }) => {
		const honeypot = page.locator("#contact-website");

		await expect(honeypot).toHaveCount(1);
		await expect(honeypot).toHaveAttribute("tabindex", "-1");
		await expect(honeypot).toHaveAttribute("autocomplete", "off");

		/**
		 * off-screen, not hidden - the field keeps real dimensions on purpose, so
		 * Playwright counts it visible. Its position is the assertion instead.
		 */
		const box = await honeypot.boundingBox();
		expect(box, "the honeypot should still be laid out").not.toBeNull();
		if (box) expect(box.x + box.width).toBeLessThan(0);

		const wrapper = honeypot.locator("xpath=ancestor::div[@aria-hidden][1]");
		await expect(wrapper).toHaveCount(1);

		await page.locator("#contact-name").focus();
		for (let step = 0; step < 8; step++) {
			await page.keyboard.press("Tab");
			const focusedId = await page.evaluate(
				() => document.activeElement?.id ?? "",
			);
			expect(focusedId).not.toBe("contact-website");
		}
	});
});
