import type { Metadata } from "next";
import { getUserNotificationsDAL } from "@/lib/dal/activity";
import { requireUser } from "@/lib/dal/auth";
import { NotificationsClient } from "./_components/notifications-client";
import { NOTIFICATIONS_PAGE_SIZE } from "./_constants/notifications";

export const metadata: Metadata = {
	title: "Notifications",
};

/**
 * The notifications surface, reached from the sidebar.
 *
 * A server component that reads the first page and hands it to a client
 * component for the interactive parts, matching how /team is built. Reading on
 * the server means the first paint already has the notifications - no loading
 * flash, and no action round trip just to fill the page. Later pages come from
 * the load-more button instead.
 *
 * There is deliberately no top-bar bell: this page is the notification surface,
 * which is one place to build and maintain instead of two.
 */
export default async function NotificationsPage() {
	await requireUser();

	const { notifications, hasMore } = await getUserNotificationsDAL(
		NOTIFICATIONS_PAGE_SIZE,
	);

	return (
		<NotificationsClient
			initialNotifications={notifications}
			initialHasMore={hasMore}
		/>
	);
}
