import type { Metadata } from "next";
import { requireUser } from "@/lib/dal/auth";
import { getNotificationSettingsDAL } from "@/lib/dal/notification-settings";
import { PageHeader } from "../_components/ui/headers/page-header";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
	title: "Settings",
};

/**
 * A server component that reads the DAL directly, matching /team and /analytics.
 *
 * The notification preferences are in the HTML on first paint rather than
 * fetched afterwards, so the switches never render in the wrong position and
 * then flick - which on a page of toggles would look exactly like someone else
 * changing them.
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
