"use client";

import { useState } from "react";
import { updateNotificationSettingsAction } from "@/lib/actions/notification-settings-actions";
import type { NotificationSettingsDTO } from "@/lib/dtos/notification-settings-dto";
import type {
	NotificationSettingKey,
	NotificationSettingsPatch,
} from "@/lib/types/notification-settings";
import { reportActionError } from "@/lib/utils/toast";
import { ALL_NOTIFICATION_KEYS } from "../_constants/notifications";

/**
 * use-notification-settings hook - manages independent notification toggles with
 * instant optimistic UI updates and automatic rollbacks, eliminating the need
 * for batch save actions.
 */
export function useNotificationSettings(initial: NotificationSettingsDTO) {
	const [settings, setSettings] = useState<NotificationSettingsDTO>(initial);
	const [pendingKeys, setPendingKeys] = useState<NotificationSettingKey[]>([]);

	/** all enabled state - evaluates true only when every notification preference is currently active. */
	const allEnabled = ALL_NOTIFICATION_KEYS.every((key) => settings[key]);

	async function save(patch: NotificationSettingsPatch) {
		const keys = Object.keys(patch) as NotificationSettingKey[];
		// state snapshot - captures current settings before optimistic updates to ensure accurate rollback on failure.
		const snapshot = settings;

		setSettings((current) => ({ ...current, ...patch }));
		setPendingKeys((current) => [...current, ...keys]);

		const result = await updateNotificationSettingsAction(patch);

		setPendingKeys((current) => current.filter((key) => !keys.includes(key)));

		if (!result.success) {
			setSettings(snapshot);
			reportActionError("Could not save notification settings", result.error);
			return;
		}

		// server reconciliation - overwrites local state with the server response to catch any backend normalizations.
		if (result.data) setSettings(result.data);
	}

	function toggle(key: NotificationSettingKey) {
		void save({ [key]: !settings[key] });
	}

	/**
	 * toggle all - batches the update for all notification preferences into a
	 * single request to prevent partial failures and inconsistent UI states.
	 */
	function toggleAll() {
		const next = !allEnabled;
		void save(
			Object.fromEntries(
				ALL_NOTIFICATION_KEYS.map((key) => [key, next]),
			) as NotificationSettingsPatch,
		);
	}

	return {
		settings,
		allEnabled,
		isPending: (key: NotificationSettingKey) => pendingKeys.includes(key),
		isBusy: pendingKeys.length > 0,
		toggle,
		toggleAll,
	};
}
