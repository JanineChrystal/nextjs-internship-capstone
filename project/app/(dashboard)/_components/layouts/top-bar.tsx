"use client";

import { UserButton } from "@clerk/nextjs";
import { Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/buttons/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { useSearchStore } from "@/stores/use-search-store";
import { GlobalSearchDialog } from "../ui/search/global-search-dialog";

export function TopBar() {
	const [mounted, setMounted] = useState(false);
	const openSearch = useSearchStore((state) => state.open);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<header className="flex-none flex items-center justify-between w-full h-16 px-6 bg-transparent sticky top-0 z-40">
			{/* Left Side: Sidebar Toggle */}
			<div className="flex flex-1 items-center gap-4">
				<SidebarTrigger className="text-foreground" />
			</div>

			{/* Right Side: Search + Actions */}
			<div className="flex items-center gap-3">
				{/*
			  The search control is a BUTTON, not an input.

			  It used to be a real text field with no state, no handler and no
			  results - it accepted typing and did nothing with it, which is the
			  worst of both worlds. The palette owns the actual input, so what sits
			  here only needs to open it. Styling it like a field keeps the header
			  looking the same while making it honest about what it does.
			*/}
				<button
					type="button"
					onClick={openSearch}
					aria-label="Search projects, tasks and people"
					className="hidden h-9 w-62.5 items-center gap-2 rounded-md border border-border bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted md:flex lg:w-87.5"
				>
					<Search className="h-4 w-4 shrink-0" aria-hidden="true" />
					<span className="flex-1 truncate">Search...</span>
					{/*
				  The shortcut is only advertised where it can be pressed. Showing
				  a keyboard hint on a touch device is noise.
				*/}
					<kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] lg:block">
						Ctrl K
					</kbd>
				</button>

				{/* Below md the field would crowd out everything else, so it collapses
			    to the icon - which opens the same palette. */}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="text-muted-foreground hover:text-foreground md:hidden"
					onClick={openSearch}
					aria-label="Search projects, tasks and people"
				>
					<Search className="h-5 w-5" />
				</Button>

				{/* User Actions: Theme & Profile */}
				<div className="flex shrink-0 items-center gap-4">
					<ThemeToggle />
					{mounted ? (
						<UserButton
							showName
							appearance={{
								...clerkAppearance,
								elements: {
									userButtonBox:
										"flex flex-row-reverse gap-2 font-medium text-sm whitespace-nowrap",
									userButtonOuterIdentifier: "text-primary",
									userButtonPopoverActionButton__manageAccount: "!hidden",
									userButtonPopoverFooter: "!hidden",
								},
							}}
						>
							<UserButton.MenuItems>
								<UserButton.Link
									label="Workspace Profile"
									labelIcon={<User className="w-4 h-4" />}
									href="/profile/u1"
								/>
							</UserButton.MenuItems>
						</UserButton>
					) : (
						<div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
					)}
				</div>
			</div>

			<GlobalSearchDialog />
		</header>
	);
}
