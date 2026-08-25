"use client";

import { UserButton } from "@clerk/nextjs";
import {
	ChevronRight,
	PanelLeftClose,
	PanelLeftOpen,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	useSidebar,
} from "@/components/ui/sidebar";
import { getUnreadNotificationCountAction } from "@/lib/actions/notification-actions";
import { clerkAppearance } from "@/lib/clerk/appearance";
import type { NavItem, NavSubItem } from "@/lib/types/nav";
import { cn } from "@/lib/utils";
import { useSettingsNavStore } from "@/stores/use-settings-nav-store";
import { UNREAD_POLL_INTERVAL_MS } from "../../_constants/activity";
import { bottomNavigation, navigationGroups } from "../../_constants/nav";

/**
 * base entry styles - defines shared structural styling for navigation items,
 * deferring color management to active/idle classes to support dynamic themes.
 */
const ENTRY_BASE =
	"font-medium rounded-lg transition-colors group-data-[collapsible=icon]:justify-center";

/**
 * active entry styles - enforces theme-aware active state coloring by using
 * important declarations to override the component's internal attribute selectors.
 */
const ENTRY_ACTIVE =
	"bg-primary! text-primary-foreground! hover:bg-primary/90!";

const ENTRY_IDLE =
	"text-muted-foreground hover:bg-accent hover:text-foreground";

/**
 * app sidebar component - provides the main navigation structure for the dashboard,
 * dynamically fetching notification counts based on route changes to ensure
 * data freshness across client-side navigations.
 */
export function AppSidebar({ className }: { className?: string }) {
	const pathname = usePathname();
	const { state, toggleSidebar, setOpenMobile, isMobile } = useSidebar();

	const [unreadNotifications, setUnreadNotifications] = useState(0);

	const activeSettingsSection = useSettingsNavStore(
		(store) => store.activeNavId,
	);
	const requestSettingsScroll = useSettingsNavStore(
		(store) => store.requestScrollTo,
	);

	/**
	 * notification count fetcher - refetches on navigation, on a timer, and when
	 * the tab regains focus. Navigation alone was not enough: a notification that
	 * arrived while the reader stayed on one page left the badge showing a stale
	 * number until they happened to click something.
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a refetch trigger, not a value the effect reads
	useEffect(() => {
		let cancelled = false;

		const refresh = () => {
			getUnreadNotificationCountAction().then((value) => {
				if (!cancelled) setUnreadNotifications(value);
			});
		};

		refresh();

		const timer = setInterval(refresh, UNREAD_POLL_INTERVAL_MS);
		/** focus refetch - covers the reader who left the tab open for an hour and came back, where the next tick could be up to a minute away. */
		window.addEventListener("focus", refresh);

		return () => {
			cancelled = true;
			clearInterval(timer);
			window.removeEventListener("focus", refresh);
		};
	}, [pathname]);

	const badgeCount = (item: NavItem): number =>
		item.badge === "unreadNotifications" ? unreadNotifications : 0;

	/**
	 * is sub-item active logic - determines active state for grouped sections like
	 * settings based on scroll position tracking rather than solely URL matching.
	 */
	const isSubItemActive = (subItem: NavSubItem): boolean => {
		if (!subItem.settingsSectionId) return pathname === subItem.href;
		return (
			pathname === subItem.href &&
			activeSettingsSection === subItem.settingsSectionId
		);
	};

	// mobile auto-close - ensures the navigation sheet dismisses itself upon selection on small screens while remaining persistent on desktop.
	const closeOnMobile = () => {
		if (isMobile) setOpenMobile(false);
	};

	return (
		<Sidebar
			collapsible="icon"
			className={cn("border-r border-border bg-sidebar", className)}
		>
			{/* structural alignment - equalizes container padding across sections so the collapsed rail remains perfectly vertical. */}
			<SidebarHeader className="p-2">
				{/* brand mark interaction - links to the dashboard root, replacing an inactive button state for better UX. */}
				<Link
					href="/dashboard"
					onClick={closeOnMobile}
					className="flex items-center gap-2 rounded-lg px-1 py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
				>
					<BrandMark />
					<span className="truncate text-lg font-semibold tracking-tight text-on-surface group-data-[collapsible=icon]:hidden">
						Takda PH
					</span>
				</Link>
			</SidebarHeader>

			<SidebarContent>
				{navigationGroups.map((group) => (
					<SidebarGroup key={group.label}>
						{/* conditional group label - hides the text when the sidebar is collapsed to save space. */}
						<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
							{group.label}
						</SidebarGroupLabel>

						<SidebarMenu className="gap-1">
							{group.items.map((item) => {
								const Icon = item.icon;
								const isActive = pathname.startsWith(item.href);
								const count = badgeCount(item);

								return (
									<SidebarMenuItem key={item.name}>
										<SidebarMenuButton
											asChild
											tooltip={
												count > 0 ? `${item.name} (${count})` : item.name
											}
											isActive={isActive}
											className={cn(
												ENTRY_BASE,
												isActive ? ENTRY_ACTIVE : ENTRY_IDLE,
											)}
										>
											<Link href={item.href} onClick={closeOnMobile}>
												{Icon && (
													<span className="relative shrink-0">
														<Icon className="size-4.5" />
														{/* rail indicator - the numeric badge below is hidden in the collapsed rail, which is the sidebar's default state, so an unread count had nowhere to show. This dot rides the icon itself and is hidden again once the labels are back. */}
														{count > 0 && (
															<span
																aria-hidden="true"
																className="absolute -right-1 -top-1 hidden size-2 rounded-full bg-primary ring-2 ring-sidebar group-data-[collapsible=icon]:block"
															/>
														)}
													</span>
												)}
												{/* nested announcement - the unread count sits inside the label span rather than beside it, because the button styles truncate `span:last-child` and a sibling would take that rule off the label. */}
												<span>
													{item.name}
													{count > 0 && (
														<span className="sr-only">, {count} unread</span>
													)}
												</span>
											</Link>
										</SidebarMenuButton>

										{/* conditional badge - hides notification counts in collapsed mode since they are provided in tooltips and would clutter the small icons. */}
										{count > 0 && (
											<SidebarMenuBadge
												className={cn(
													"pointer-events-none tabular-nums group-data-[collapsible=icon]:hidden",
													isActive
														? "text-primary-foreground"
														: "bg-primary/10 text-primary",
												)}
											>
												{count > 99 ? "99+" : count}
											</SidebarMenuBadge>
										)}
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter className="gap-2 p-2">
				<SidebarMenu className="gap-1">
					{bottomNavigation.map((item) => {
						const Icon = item.icon;
						const isActive = pathname.startsWith(item.href);
						const subItems = item.subItems ?? [];

						if (subItems.length === 0) {
							return (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton
										asChild
										tooltip={item.name}
										isActive={isActive}
										className={cn(
											ENTRY_BASE,
											isActive ? ENTRY_ACTIVE : ENTRY_IDLE,
										)}
									>
										<Link href={item.href} onClick={closeOnMobile}>
											{Icon && <Icon className="size-4.5 shrink-0" />}
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						}

						/**
						 * settings menu popover - utilizes a floating dropdown for settings sub-items to prevent layout shifting and support collapsed sidebar interactions.
						 */
						return (
							<SidebarMenuItem key={item.name}>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<SidebarMenuButton
											tooltip={item.name}
											isActive={isActive}
											className={cn(
												ENTRY_BASE,
												isActive ? ENTRY_ACTIVE : ENTRY_IDLE,
											)}
										>
											{Icon && <Icon className="size-4.5 shrink-0" />}
											<span className="group-data-[collapsible=icon]:hidden">
												{item.name}
											</span>
											<ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
										</SidebarMenuButton>
									</DropdownMenuTrigger>

									{/* popover placement - positions the dropdown relative to the sidebar orientation based on device size. */}
									<DropdownMenuContent
										side={isMobile ? "top" : "right"}
										align="end"
										sideOffset={8}
										className="min-w-48"
									>
										<DropdownMenuLabel>{item.name}</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{subItems.map((subItem) => (
											<DropdownMenuItem key={subItem.name} asChild>
												<Link
													href={subItem.href}
													data-active={isSubItemActive(subItem)}
													className="data-[active=true]:text-primary data-[active=true]:font-medium"
													onClick={() => {
														// scroll request delegation - dispatches scroll navigation events to the store to handle both internal scrolling and cross-page navigation uniformly.
														if (subItem.settingsSectionId) {
															requestSettingsScroll(subItem.settingsSectionId);
														}
														closeOnMobile();
													}}
												>
													{subItem.name}
												</Link>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</SidebarMenuItem>
						);
					})}

					{/* desktop collapse toggle - embeds the sidebar collapse control at the bottom of the navigation area, hiding it on mobile where the sidebar functions as an overlay. */}
					<SidebarMenuItem className="hidden md:block">
						<SidebarMenuButton
							tooltip={state === "collapsed" ? "Expand sidebar" : undefined}
							onClick={toggleSidebar}
							className={cn(ENTRY_BASE, ENTRY_IDLE)}
						>
							{state === "collapsed" ? (
								<PanelLeftOpen className="size-4.5 shrink-0" />
							) : (
								<PanelLeftClose className="size-4.5 shrink-0" />
							)}
							<span className="group-data-[collapsible=icon]:hidden">
								Collapse sidebar
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<SidebarSeparator className="mx-0" />

				{/* identity footer - positions the user account menu at the bottom of the sidebar to distinguish it from the operational tools in the top bar. */}
				{/* footer padding alignment - ensures the avatar container aligns perfectly with the navigation icons above it when expanded. */}
				<div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
					<AccountMenu collapsed={state === "collapsed" && !isMobile} />
				</div>

				{isMobile && (
					<div className="px-2 pb-1">
						<MobileProfileLink onNavigate={() => setOpenMobile(false)} />
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}

/**
 * account menu component - defers Clerk's UserButton rendering until client hydration,
 * utilizing an identically sized skeleton placeholder to eliminate layout shifts on load.
 */
function AccountMenu({ collapsed }: { collapsed: boolean }) {
	const [mounted, setMounted] = useState(false);
	const { isMobile } = useSidebar();

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<div className="flex items-center gap-2">
				<div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
				{!collapsed && (
					<div className="h-4 w-24 animate-pulse rounded bg-muted" />
				)}
			</div>
		);
	}

	return (
		<UserButton
			// name suppression - hides the user's name when the sidebar is collapsed to save space.
			showName={!collapsed}
			appearance={{
				...clerkAppearance,
				elements: {
					rootBox: "w-full",
					userButtonBox:
						"flex flex-row gap-2 font-medium text-sm w-full justify-start",
					userButtonOuterIdentifier:
						"text-on-surface truncate max-w-36 text-left",
					userButtonPopoverActionButton__manageAccount: "!hidden",
					userButtonPopoverFooter: "!hidden",
				},
			}}
		>
			{/* self link - "me" rather than an id, because this component only ever sees the Clerk id and the route is keyed by the database one. The page resolves it server-side. */}
			{!isMobile && (
				<UserButton.MenuItems>
					<UserButton.Link
						label="Workspace Profile"
						labelIcon={<User className="size-4" />}
						href="/profile/me"
					/>
				</UserButton.MenuItems>
			)}
		</UserButton>
	);
}

/**
 * The same destination, reachable on a phone.
 *
 * The mobile sidebar is a Sheet, and a Sheet is a modal dialog: it puts
 * `pointer-events: none` on the body and traps focus. Clerk portals its menu to
 * the body, so on mobile the item rendered and simply could not be clicked.
 * This link lives inside the Sheet, where clicks land.
 */
function MobileProfileLink({ onNavigate }: { onNavigate: () => void }) {
	return (
		<Link
			href="/profile/me"
			onClick={onNavigate}
			className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
		>
			<User className="size-4 shrink-0" />
			Workspace Profile
		</Link>
	);
}
