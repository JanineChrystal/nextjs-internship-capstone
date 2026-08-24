import type { Metadata } from "next";
import { requireUser } from "@/lib/dal/auth";
import { getNotificationSettingsDAL } from "@/lib/dal/notification-settings";
import { PageHeader } from "../_components/ui/headers/page-header";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
	title: "Settings",
};

/**
 * settings page - fetches notification preferences directly via the DAL on the
 * server to ensure toggles render in their correct state on first paint,
 * avoiding confusing visual flicker.
 */
export default async function SettingsPage() {
	await requireUser();

	const notificationSettings = await getNotificationSettingsDAL();

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			<PageHeader
				title="Settings"
				description="Manage your account and application preferences. Everything lives on this page - the Settings menu in the sidebar jumps you to a section."
			/>

			<SettingsClient notificationSettings={notificationSettings} />
		</div>
	);
}
