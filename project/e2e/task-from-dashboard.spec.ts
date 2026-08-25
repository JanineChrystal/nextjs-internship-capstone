import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers/naming";

/** critical flow - the dashboard task shortcut, whose failure mode is a task that looks created and was never saved. Runbook DASH-07. */
test("creates a task from the dashboard that is really saved", async ({
	page,
}) => {
	const taskName = uniqueName("E2E Task");

	await page.goto("/dashboard");
	await expect(
		page.getByRole("heading", { name: "Quick Actions" }),
	).toBeVisible();

	await page.getByRole("button", { name: /Create Task/ }).click();

	/** step one - the picker, which exists because the dashboard has no project in its URL to infer one from. */
	const picker = page.getByRole("dialog");
	await expect(
		picker.getByText("Which project is this task for?"),
	).toBeVisible();

	const projectList = picker.getByRole("list", { name: "Projects" });
	const firstProject = projectList.getByRole("button").first();
	await expect(firstProject).toBeVisible();

	/** captured now - this is the board the task has to appear on later. */
	const projectName = (
		await firstProject.locator("span span").first().innerText()
	).trim();

	await firstProject.click();
	await picker.getByRole("button", { name: "Continue" }).click();

	/** step two - the editor opens in place; staying on /dashboard is part of the contract. */
	const taskModal = page.getByRole("dialog");
	const nameField = taskModal.getByLabel("Task name");
	await expect(nameField).toBeVisible();
	await expect(page).toHaveURL(/\/dashboard/);

	await nameField.fill(taskName);
	await taskModal.getByRole("button", { name: "Create Task" }).click();
	await expect(taskModal).toBeHidden();

	/** fresh render - navigating to the board reads from the database, not from the store the create wrote to. */
	await page.goto("/projects");
	await page.getByText(projectName, { exact: true }).first().click();
	await page.waitForURL(/\/projects\/[0-9a-f-]{36}/);

	await expect(page.getByText(taskName).first()).toBeVisible({
		timeout: 20_000,
	});
});
