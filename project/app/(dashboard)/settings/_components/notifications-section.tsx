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
 * toggle row component - renders a switch with an expanded hit target using htmlFor,
 * avoiding invalid markup caused by nesting Radix buttons inside labels.
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
 * notifications section component - provides a list of independent email preference
 * toggles that save instantly upon interaction without requiring a batch submit.
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
					// master switch derivation - determines the 'allow all' state from individual toggles and applies changes across all five options when flipped.
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
