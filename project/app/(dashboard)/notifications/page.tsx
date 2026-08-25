import type { Metadata } from "next";
import { getUserNotificationsDAL } from "@/lib/dal/activity";
import { requireUser } from "@/lib/dal/auth";
import { NotificationsClient } from "./_components/notifications-client";
import { NOTIFICATIONS_PAGE_SIZE } from "./_constants/notifications";

export const metadata: Metadata = {
	title: "Notifications",
};

/**
 * notifications page - a server component that fetches the initial page of
 * notifications to prevent loading flashes, delegating interactive
 * load-more behavior to a client component.
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
