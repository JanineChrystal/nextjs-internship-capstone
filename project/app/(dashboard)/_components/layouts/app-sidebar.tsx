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
import { bottomNavigation, navigationGroups } from "../../_constants/nav";

/**
 * Shared by every entry so active and idle states cannot drift apart.
 *
 * The active treatment was three hard-coded `#0D47A1` literals - the same hex
 * three times, in a file that has nothing else to say about colour. It ignored
 * dark mode, and it would have ignored the Phase 7 palettes too. `bg-primary`
 * is the same blue in light mode and follows the theme everywhere else.
 */
const ENTRY_BASE =
	"font-medium rounded-lg transition-colors group-data-[collapsible=icon]:justify-center";

/**
 * The `!` is load-bearing, not laziness.
 *
 * `SidebarMenuButton` carries `data-[active=true]:bg-sidebar-accent` in its own
 * base classes. That is an attribute selector, so it outranks a plain
 * `bg-primary` on specificity and would paint the active entry grey no matter
 * what is passed in. Marking these important is the smallest way to say "the
 * app decides what active looks like" without forking the shared component.
 */
const ENTRY_ACTIVE =
	"bg-primary! text-primary-foreground! hover:bg-primary/90!";

const ENTRY_IDLE =
	"text-muted-foreground hover:bg-accent hover:text-foreground";

/**
 * The dashboard's primary navigation.
 *
 * ## What changed and why
 *
 * It was a flat list of seven links with the active state painted in a repeated
 * hex literal, a brand block that was a button but did nothing, and no way to
 * see anything was waiting for you. It is now grouped under labels, badges the
 * unread count, and carries the account menu at the foot - which is where a
 * sidebar of this shape puts identity, leaving the top bar for tools.
 *
 * ## Why the badge count lives here and not in the layout
 *
 * The layout is a server component, so a count fetched there would be as stale
 * as the last full page load - and every move around the dashboard is a client
 * navigation. Fetching here, keyed on `pathname`, means the number is right
 * after the navigation that would have changed it, without polling.
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

	// Keyed on `pathname`, which also covers the first render. Reading
	// /notifications is the thing most likely to change this number, and
	// arriving or leaving is exactly when the badge would otherwise be wrong.
	// The cancel flag matters because navigating twice quickly can land two
	// responses out of order, and the slower one would win.
	//
	// `pathname` is the trigger, not a value the effect body reads. Taking the
	// linter's fix would freeze the badge at whatever it was when the dashboard
	// first mounted, because the sidebar never unmounts between routes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the refetch trigger
	useEffect(() => {
		let cancelled = false;

		getUnreadNotificationCountAction().then((value) => {
			if (!cancelled) setUnreadNotifications(value);
		});

		return () => {
			cancelled = true;
		};
	}, [pathname]);

	const badgeCount = (item: NavItem): number =>
		item.badge === "unreadNotifications" ? unreadNotifications : 0;

	/**
	 * A sub-item that scrolls is active when its section is the one on screen,
	 * not when the URL matches - four entries share the one /settings path, so
	 * comparing hrefs would light up all four at once.
	 */
	const isSubItemActive = (subItem: NavSubItem): boolean => {
		if (!subItem.settingsSectionId) return pathname === subItem.href;
		return (
			pathname === subItem.href &&
			activeSettingsSection === subItem.settingsSectionId
		);
	};

	// On a phone the sidebar is a Sheet over the page, so it has to close itself
	// when a link is taken. On desktop it is part of the layout and must not.
	const closeOnMobile = () => {
		if (isMobile) setOpenMobile(false);
	};

	return (
		<Sidebar
			collapsible="icon"
			className={cn("border-r border-border bg-sidebar", className)}
		>
			{/* `p-2`, matching SidebarGroup and SidebarFooter exactly. It was `p-3`,
			    which inset the brand mark four pixels further than every icon below
			    it - enough that the rail read as a crooked column rather than a
			    straight one. Padding on the containers is what aligns a collapsed
			    sidebar; the buttons themselves are already square and centred. */}
			<SidebarHeader className="p-2">
				{/* A link home, not a button that did nothing. It looked pressable and
				    was `cursor-default` with no handler, which is a control that lies
				    about itself. */}
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
						{/* Hidden when collapsed: a label over a column of icons has
						    nothing to label and only steals vertical space. */}
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
												{Icon && <Icon className="size-4.5 shrink-0" />}
												<span>{item.name}</span>
											</Link>
										</SidebarMenuButton>

										{/* Hidden while collapsed rather than shrunk into the
										    rail: a number floating over a 20px icon is unreadable,
										    and the count is already in the tooltip. */}
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
						 * Settings opens a floating menu rather than an inline submenu.
						 *
						 * The submenu used to push four rows into the sidebar and shove
						 * the account row down with them - and in the collapsed rail it
						 * could not render at all, so pressing Settings had to force the
						 * whole sidebar open first just to show four links. A popover
						 * costs no layout, works identically in the rail, and matches
						 * how the account menu below already behaves.
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

									{/* `side="right"` on desktop puts it beside the sidebar
									    rather than over the navigation it came from; on a phone
									    the sheet is the full width, so it goes above instead. */}
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
														// Same-page sections rather than routes: the store
														// carries the request so it works both when already
														// on /settings (the Link is a no-op and this
														// scrolls) and when arriving from elsewhere (the
														// page consumes it on mount).
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

					{/* The collapse control lives here, not in the top bar.
					    It is a property of the sidebar, so it belongs to the sidebar -
					    and the header is then free to be about the page you are on.
					    Hidden below md: on a phone the sidebar is a sheet that is
					    either open or gone, so there is no rail to collapse to, and the
					    top bar keeps a trigger for opening it. */}
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

				{/* Identity at the foot of the navigation, tools in the top bar. The
				    account menu used to sit beside Search and the theme toggle, which
				    put "who am I" and "what can I do" in the same corner. */}
				{/* `px-2` rather than `px-1`: the nav buttons carry their own `p-2`
				    inside the footer's, so an avatar at `px-1` sat four pixels left of
				    every icon above it. Collapsed, the padding drops and flex centring
				    takes over. */}
				<div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
					<AccountMenu collapsed={state === "collapsed" && !isMobile} />
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}

/**
 * Clerk's account menu, mounted only after hydration.
 *
 * `UserButton` renders nothing on the server and then appears, so without the
 * placeholder the sidebar footer visibly jumps on every load. The skeleton is
 * the same size as the control it stands in for, which is what makes the swap
 * invisible rather than merely fast.
 */
function AccountMenu({ collapsed }: { collapsed: boolean }) {
	const [mounted, setMounted] = useState(false);

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
			// The name is dropped in the rail, where there is no room for it - the
			// avatar alone still opens the same menu.
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
			{/* Carried over from the top bar unchanged. Note the hard-coded `u1` -
			    that was already there and looks wrong; /profile/[id] expects a real
			    user id, so this almost certainly 404s. Left as-is rather than
			    guessed at during a layout change. */}
			<UserButton.MenuItems>
				<UserButton.Link
					label="Workspace Profile"
					labelIcon={<User className="size-4" />}
					href="/profile/u1"
				/>
			</UserButton.MenuItems>
		</UserButton>
	);
}
