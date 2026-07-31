"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/nav";
import { bottomNavigation, mainNavigation } from "../../_constants/nav";

export function AppSidebar({ className }: { className?: string }) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" className={className}>
			<SidebarContent>
				{/* UPPER SIDEBAR GROUP */}
				<SidebarGroup>
					<SidebarMenu>
						{mainNavigation.map((item: NavItem) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;

							// Check if the main item has a dropdown
							if (item.subItems && item.subItems.length > 0) {
								return (
									<SidebarMenuItem key={item.name}>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<SidebarMenuButton
													tooltip={item.name}
													isActive={pathname.startsWith(item.href)}
												>
													<Icon />
													<span>{item.name}</span>
												</SidebarMenuButton>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												side="right"
												className="w-48 rounded-lg shadow-md bg-popover text-popover-foreground border border-border"
											>
												{item.subItems.map((subItem) => (
													<DropdownMenuItem key={subItem.name} asChild>
														<Link
															href={subItem.href}
															className="cursor-pointer"
														>
															{subItem.name}
														</Link>
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									</SidebarMenuItem>
								);
							}

							return (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton
										asChild
										tooltip={item.name}
										isActive={isActive}
									>
										<Link href={item.href}>
											<Icon />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				{/* BOTTOM SIDEBAR GROUP */}
				<SidebarGroup className="mt-auto">
					<SidebarMenu>
						{bottomNavigation.map((item: NavItem) => {
							const Icon = item.icon;
							const isActive = pathname.startsWith(item.href);

							// LOGOUT LOGIC
							if (item.name === "Log Out") {
								return (
									<SidebarMenuItem key={item.name}>
										<SignOutButton redirectUrl="/sign-in">
											<SidebarMenuButton tooltip={item.name}>
												<Icon />
												<span>{item.name}</span>
											</SidebarMenuButton>
										</SignOutButton>
									</SidebarMenuItem>
								);
							}

							// DYNAMIC DROPDOWN LOGIC (Automatically detects Settings subItems)
							if (item.subItems && item.subItems.length > 0) {
								return (
									<SidebarMenuItem key={item.name}>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<SidebarMenuButton
													tooltip={item.name}
													isActive={isActive}
												>
													<Icon />
													<span>{item.name}</span>
												</SidebarMenuButton>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												side="right"
												className="w-48 rounded-lg shadow-md bg-popover text-popover-foreground border border-border"
											>
												{/* Map through the subItems dynamically */}
												{item.subItems.map((subItem) => (
													<DropdownMenuItem key={subItem.name} asChild>
														<Link
															href={subItem.href}
															className="cursor-pointer"
														>
															{subItem.name}
														</Link>
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									</SidebarMenuItem>
								);
							}

							// NORMAL BOTTOM LINK LOGIC
							return (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton
										asChild
										tooltip={item.name}
										isActive={pathname === item.href}
									>
										<Link href={item.href}>
											<Icon />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
