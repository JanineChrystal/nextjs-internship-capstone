"use client";

import { useMemo, useState } from "react";
import {
	deleteNotificationAction,
	getUserNotificationsAction,
	markAllNotificationsAsReadAction,
	markNotificationAsReadAction,
} from "@/lib/actions/notification-actions";
import type { NotificationFeedItemDTO } from "@/lib/dtos/activity-dto";
import { groupByDay } from "@/lib/utils/date";
import {
	notify,
	reportActionError,
	reportActionSuccess,
} from "@/lib/utils/toast";
import { NOTIFICATIONS_PAGE_SIZE } from "../_constants/notifications";

/**
 * use-notifications hook - manages paginated notification state with
 * optimistic updates for read status and dismissal, initializing from
 * server-provided data.
 */
export function useNotifications(
	initialNotifications: NotificationFeedItemDTO[],
	initialHasMore: boolean,
) {
	const [notifications, setNotifications] = useState(initialNotifications);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isBusy, setIsBusy] = useState(false);

	const unreadCount = useMemo(
		() => notifications.filter((item) => !item.isRead).length,
		[notifications],
	);

	// local timezone grouping - groups dates on the client to accurately reflect "Today" based on the user's local timezone.
	const groups = useMemo(() => groupByDay(notifications), [notifications]);

	const markRead = async (notificationId: string) => {
		const target = notifications.find((item) => item.id === notificationId);
		// redundant write prevention - skips API calls for already-read notifications.
		if (!target || target.isRead) return;

		const previous = notifications;
		setNotifications((current) =>
			current.map((item) =>
				item.id === notificationId ? { ...item, isRead: true } : item,
			),
		);

		const result = await markNotificationAsReadAction(notificationId);
		if (!result.success) {
			setNotifications(previous);
			reportActionError("Could not mark as read", result.error);
		}
	};

	const markAllRead = async () => {
		if (unreadCount === 0 || isBusy) return;

		const previous = notifications;
		setIsBusy(true);
		setNotifications((current) =>
			current.map((item) => ({ ...item, isRead: true })),
		);

		const result = await markAllNotificationsAsReadAction();
		if (!result.success) {
			setNotifications(previous);
			reportActionError("Could not mark all as read", result.error);
		} else {
			reportActionSuccess(
				`${unreadCount} ${unreadCount === 1 ? "notification" : "notifications"} marked as read`,
			);
		}
		setIsBusy(false);
	};

	const remove = async (notificationId: string) => {
		const previous = notifications;
		setNotifications((current) =>
			current.filter((item) => item.id !== notificationId),
		);

		const result = await deleteNotificationAction(notificationId);
		if (!result.success) {
			setNotifications(previous);
			reportActionError("Could not remove notification", result.error);
		} else {
			// toast debouncing - reuses a fixed toast ID to prevent rapid dismissals from flooding the screen with notifications.
			notify.success("Notification removed", { id: "notification-removed" });
		}
	};

	const loadMore = async () => {
		if (isLoadingMore || !hasMore) return;

		setIsLoadingMore(true);
		// offset pagination - uses current item count rather than page numbers to prevent skipping items when rows are dismissed.
		const result = await getUserNotificationsAction(
			NOTIFICATIONS_PAGE_SIZE,
			notifications.length,
		);

		if (result.success && result.data) {
			const page = result.data;
			setNotifications((current) => {
				// real-time deduplication - filters out items that arrived or shifted between page loads to prevent duplicate rows.
				const seen = new Set(current.map((item) => item.id));
				return [
					...current,
					...page.notifications.filter((item) => !seen.has(item.id)),
				];
			});
			setHasMore(page.hasMore);
		} else if (result.error) {
			reportActionError("Could not load more notifications", result.error);
		}

		setIsLoadingMore(false);
	};

	return {
		notifications,
		groups,
		unreadCount,
		hasMore,
		isLoadingMore,
		isBusy,
		markRead,
		markAllRead,
		remove,
		loadMore,
	};
}
