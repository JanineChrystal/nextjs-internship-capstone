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
 * The toggle state for the Notifications section.
 *
 * Optimistic with rollback, matching every other mutation in this app: the
 * switch moves the instant it is clicked and snaps back only if the server
 * rejects it. A switch that waits for a round-trip before moving feels broken on
 * a slow connection, and this is the interaction most likely to be flicked
 * several times in a row.
 *
 * There is no save button by design. Each switch is an independent preference,
 * so there is nothing to batch and nothing a "cancel" would meaningfully undo.
 */
export function useNotificationSettings(initial: NotificationSettingsDTO) {
	const [settings, setSettings] = useState<NotificationSettingsDTO>(initial);
	const [pendingKeys, setPendingKeys] = useState<NotificationSettingKey[]>([]);

	/** True when every switch this page shows is on - the master switch's state. */
	const allEnabled = ALL_NOTIFICATION_KEYS.every((key) => settings[key]);

	async function save(patch: NotificationSettingsPatch) {
		const keys = Object.keys(patch) as NotificationSettingKey[];
		// Snapshot before the optimistic write, so a rollback restores exactly what
		// was on screen rather than re-deriving it from a possibly stale copy.
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

		// Reconciled against the server's copy rather than left on the optimistic
		// guess, so a value the server normalised differently is corrected here
		// instead of drifting until the next page load.
		if (result.data) setSettings(result.data);
	}

	function toggle(key: NotificationSettingKey) {
		void save({ [key]: !settings[key] });
	}

	/**
	 * The master switch writes every key at once rather than firing five separate
	 * requests - five round-trips would let the UI settle into a half-toggled
	 * state if one of them failed.
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
