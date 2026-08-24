"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationSettingsDTO } from "@/lib/dtos/notification-settings-dto";
import { useSettingsNavStore } from "@/stores/use-settings-nav-store";
import { AppearanceSection } from "./_components/appearance-section";
import { NotificationsSection } from "./_components/notifications-section";
import { useSettingsScroll } from "./_hooks/use-settings-scroll";

/**
 * account section component - dynamically imports the heavy Clerk UserProfile
 * component for client-side rendering, using a tall skeleton placeholder to
 * prevent layout shifts that would confuse the scroll-spy navigation.
 */
const AccountSection = dynamic(
	() => import("./_components/account-section").then((m) => m.AccountSection),
	{
		ssr: false,
		// placeholder id attachment - applies the target ID to the skeleton so scroll-spy and anchor links function correctly before the real component loads.
		loading: () => (
			<Skeleton
				id="settings-account"
				className="h-128 w-full rounded-xl scroll-mt-24"
			/>
		),
	},
);

interface SettingsClientProps {
	notificationSettings: NotificationSettingsDTO;
}

export function SettingsClient({ notificationSettings }: SettingsClientProps) {
	useSettingsScroll();

	const reset = useSettingsNavStore((state) => state.reset);

	// scroll-spy reset - clears the global settings navigation state on unmount to prevent stale highlights on subsequent visits.
	useEffect(() => reset, [reset]);

	return (
		// full width layout - utilizes a single column design to maximize space for the Clerk panel, removing redundant in-page navigation.
		<div className="flex flex-col gap-6 min-w-0">
			<AccountSection />
			<NotificationsSection initialSettings={notificationSettings} />
			<AppearanceSection />
		</div>
	);
}
