"use client";

import { Switch } from "@/components/ui/switch";
import type { NotificationSettingsDTO } from "@/lib/dtos/notification-settings-dto";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TOGGLES } from "../_constants/notifications";
import { useNotificationSettings } from "../_hooks/use-notification-settings";
import { SettingsSection } from "./settings-section";

interface NotificationsSectionProps {
	initialSettings: NotificationSettingsDTO;
}

interface ToggleRowProps {
	id: string;
	label: string;
	description: string;
	pendingNote?: string;
	checked: boolean;
	disabled: boolean;
	onToggle: () => void;
	className?: string;
}

/**
 * One switch and its label.
 *
 * The whole row is the label, so the text is a hit target too - a 32px switch is
 * a small thing to aim at, and the description beside it is dead space
 * otherwise. `htmlFor` rather than wrapping the switch in the label, because a
 * Radix switch renders a button and a button inside a label is invalid markup
 * that browsers handle inconsistently.
 */
function ToggleRow({
	id,
	label,
	description,
	pendingNote,
	checked,
	disabled,
	onToggle,
	className,
}: ToggleRowProps) {
	return (
		<div
			className={cn(
				"flex items-start justify-between gap-6 py-4",
				disabled && "opacity-60",
				className,
			)}
		>
			<label htmlFor={id} className="flex-1 min-w-0 cursor-pointer">
				<span className="block text-sm font-medium text-on-surface">
					{label}
				</span>
				<span className="block text-sm text-secondary mt-0.5">
					{description}
				</span>
				{pendingNote && (
					<span className="block text-xs text-secondary/80 mt-1 italic">
						{pendingNote}
					</span>
				)}
			</label>

			<Switch
				id={id}
				checked={checked}
				disabled={disabled}
				onCheckedChange={onToggle}
				className="mt-0.5 shrink-0"
			/>
		</div>
	);
}

/**
 * Email preferences.
 *
 * Every switch saves on its own the moment it moves - no save button, because
 * each preference is independent and there is nothing to batch or to cancel.
 */
export function NotificationsSection({
	initialSettings,
}: NotificationsSectionProps) {
	const { settings, allEnabled, isPending, isBusy, toggle, toggleAll } =
		useNotificationSettings(initialSettings);

	return (
		<SettingsSection
			id="settings-notifications"
			title="Notifications"
			description="Choose which emails you want to receive. In-app notifications always appear on the Notifications page regardless of these settings."
		>
			<div className="flex flex-col">
				<ToggleRow
					id="notify-all"
					label="Allow all"
					description="Turn every email below on or off at once."
					checked={allEnabled}
					// The master switch is derived from the others rather than stored,
					// so it has no column of its own - flipping it writes all five.
					disabled={isBusy}
					onToggle={toggleAll}
					className="border-b border-border pb-4"
				/>

				<div className="divide-y divide-border/60">
					{NOTIFICATION_TOGGLES.map((option) => (
						<ToggleRow
							key={option.key}
							id={`notify-${option.key}`}
							label={option.label}
							description={option.description}
							pendingNote={option.pendingNote}
							checked={settings[option.key]}
							disabled={isPending(option.key)}
							onToggle={() => toggle(option.key)}
						/>
					))}
				</div>
			</div>
		</SettingsSection>
	);
}
