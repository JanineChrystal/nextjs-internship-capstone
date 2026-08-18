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
import { reportActionError } from "@/lib/utils/toast";
import { NOTIFICATIONS_PAGE_SIZE } from "../_constants/notifications";

/**
 * List state for the notifications page: paging, read state and dismissal.
 *
 * Every mutation is optimistic with rollback, the same pattern the rest of the
 * app uses - the row updates immediately and only reverts if the server rejects
 * it. Waiting for a round trip to grey out or remove a row would feel broken for
 * something this small.
 *
 * The first page arrives from the server component, so there is no fetch on
 * mount and no initial loading state to render.
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

	// Grouped in the browser rather than the query, because "Today" depends on
	// the reader's timezone - the server has no idea what day it is for them.
	const groups = useMemo(() => groupByDay(notifications), [notifications]);

	const markRead = async (notificationId: string) => {
		const target = notifications.find((item) => item.id === notificationId);
		// Already read: nothing to persist, and skipping avoids a pointless write.
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
		}
	};

	const loadMore = async () => {
		if (isLoadingMore || !hasMore) return;

		setIsLoadingMore(true);
		// Offset from what is on screen rather than a page counter, so dismissing
		// a row before loading more does not skip the row that shuffled up.
		const result = await getUserNotificationsAction(
			NOTIFICATIONS_PAGE_SIZE,
			notifications.length,
		);

		if (result.success && result.data) {
			const page = result.data;
			setNotifications((current) => {
				// De-duplicated by id: a notification arriving between page loads
				// shifts the offset window, which can otherwise repeat a row.
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
