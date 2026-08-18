"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationSettingsDTO } from "@/lib/dtos/notification-settings-dto";
import { useSettingsNavStore } from "@/stores/use-settings-nav-store";
import { AppearanceSection } from "./_components/appearance-section";
import { NotificationsSection } from "./_components/notifications-section";
import { SettingsNavCard } from "./_components/settings-nav-card";
import { useSettingsScroll } from "./_hooks/use-settings-scroll";

/**
 * Clerk's UserProfile is the heaviest thing on this page by a wide margin, and
 * it cannot render on the server, so it is split out and loaded in the browser.
 * The skeleton holds its height so the two sections below do not jump upward
 * while it arrives - which would fire the scroll-spy against positions that are
 * about to change.
 */
const AccountSection = dynamic(
	() => import("./_components/account-section").then((m) => m.AccountSection),
	{
		ssr: false,
		// The placeholder carries the real section's id. Without it the scroll-spy
		// would start with only two of the three sections to observe and never
		// pick up the third, and a Security click from another page would find no
		// target to scroll to - the exact journey the sub-menu exists for.
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

	// The store outlives this page, so a stale highlight would be waiting the next
	// time someone opens Settings - showing Appearance as current while they are
	// looking at the top of the page.
	useEffect(() => reset, [reset]);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
			<SettingsNavCard />

			<div className="flex flex-col gap-6 min-w-0">
				<AccountSection />
				<NotificationsSection initialSettings={notificationSettings} />
				<AppearanceSection />
			</div>
		</div>
	);
}
