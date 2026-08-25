import { expect, type Locator, type Page } from "@playwright/test";

/** the popover - Radix portals it, so it is not inside the toolbar that opened it. */
function filterPanel(page: Page): Locator {
	return page.locator("[data-radix-popper-content-wrapper]").last();
}

/**
 * toggle one filter option - the popover is two levels deep: a list of fields,
 * then that field's options. Clicking the option's label toggles its checkbox.
 */
export async function toggleFilter(
	page: Page,
	fieldLabel: string,
	optionLabel: string,
): Promise<void> {
	await page.getByRole("button", { name: "Filter" }).click();

	const panel = filterPanel(page);
	await expect(panel.getByRole("heading", { name: "Filters" })).toBeVisible();

	await panel.getByRole("button", { name: fieldLabel, exact: true }).click();
	await panel.locator("label").filter({ hasText: optionLabel }).first().click();

	await page.keyboard.press("Escape");
	await expect(panel).toBeHidden();
}

/** clear every filter - Reset All only appears once something is selected. */
export async function resetFilters(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Filter" }).click();

	const panel = filterPanel(page);
	await panel.getByRole("button", { name: "Reset All" }).click();

	await page.keyboard.press("Escape");
	await expect(panel).toBeHidden();
}
