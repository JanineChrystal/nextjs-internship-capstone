"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { bottomNavigation, mainNavigation } from "../../_constants/nav";

export function AppSidebar({ className }: { className?: string }) {
	const pathname = usePathname();
	const { state, setOpen } = useSidebar();

	return (
		<Sidebar
			collapsible="icon"
			className={cn("border-r border-border bg-sidebar", className)}
		>
			{/* Top: Logo */}
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="hover:bg-transparent cursor-default group-data-[collapsible=icon]:justify-center"
						>
							<div className="flex aspect-square size-8 group-data-[collapsible=icon]:size-5 items-center justify-center rounded-lg group-data-[collapsible=icon]:rounded-md bg-[#0D47A1] text-white transition-all">
								<span className="font-bold text-lg group-data-[collapsible=icon]:text-sm">
									T
								</span>
							</div>
							<div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
								<span className="text-[22px] font-bold text-[#0D47A1] tracking-tight">
									Takda PH
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			{/* Middle: Navigation Links */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu className="gap-1.5">
						{mainNavigation.map((item) => {
							const Icon = item.icon;
							const isActive = pathname.startsWith(item.href);

							return (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton
										asChild
										tooltip={item.name}
										isActive={isActive}
										className={
											isActive
												? "bg-[#0D47A1] text-white hover:bg-[#0D47A1]/90 hover:text-white font-medium rounded-lg"
												: "text-muted-foreground hover:bg-accent hover:text-foreground font-medium rounded-lg transition-colors"
										}
									>
										<Link href={item.href}>
											<Icon className="w-5 h-5" />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			{/* Bottom: Settings with Expandable Submenus */}
			<SidebarFooter className="p-4 pb-12 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-12">
				<SidebarMenu className="gap-1.5">
					{bottomNavigation.map((item) => {
						const Icon = item.icon;
						const isActive = pathname.startsWith(item.href);
						const hasSubItems = item.subItems && item.subItems.length > 0;

						const buttonStyles = isActive
							? "bg-[#0D47A1] text-white hover:bg-[#0D47A1]/90 hover:text-white font-medium rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
							: "text-muted-foreground hover:bg-accent hover:text-foreground font-medium rounded-lg transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0";

						if (hasSubItems) {
							return (
								<Collapsible
									key={item.name}
									asChild
									defaultOpen={isActive}
									className="group/collapsible"
								>
									<SidebarMenuItem>
										<CollapsibleTrigger asChild>
											<SidebarMenuButton
												size="lg"
												tooltip={item.name}
												isActive={isActive}
												className={buttonStyles}
												onClick={() => {
													if (state === "collapsed") {
														setOpen(true);
													}
												}}
											>
												<Icon className="w-5 h-5 shrink-0" />
												<span className="group-data-[collapsible=icon]:hidden">
													{item.name}
												</span>
												<ChevronRight className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
											</SidebarMenuButton>
										</CollapsibleTrigger>

										<CollapsibleContent>
											<SidebarMenuSub className="mt-1 border-l-border">
												{item.subItems?.map((subItem) => (
													<SidebarMenuSubItem key={subItem.name}>
														<SidebarMenuSubButton
															asChild
															isActive={pathname === subItem.href}
															className="font-medium hover:bg-accent/50 text-muted-foreground hover:text-foreground"
														>
															<Link href={subItem.href}>
																<span>{subItem.name}</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</SidebarMenuItem>
								</Collapsible>
							);
						}

						return (
							<SidebarMenuItem key={item.name}>
								<SidebarMenuButton
									asChild
									size="lg"
									tooltip={item.name}
									isActive={isActive}
									className={buttonStyles}
									onClick={() => {
										if (state === "collapsed") {
											setOpen(true);
										}
									}}
								>
									<Link href={item.href}>
										<Icon className="w-5 h-5 shrink-0" />
										<span className="group-data-[collapsible=icon]:hidden">
											{item.name}
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
