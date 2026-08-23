"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/buttons/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchStore } from "@/stores/use-search-store";
import { bottomNavigation, mainNavigation } from "../../_constants/nav";
import { GlobalSearchDialog } from "../ui/search/global-search-dialog";

/**
 * Resolves the current route to the nav entry it belongs to.
 *
 * Longest match wins. `/projects/abc` and `/projects` both start with
 * `/projects`, but so would a future `/project-templates` under a naive
 * `startsWith` on the shorter of two candidates - sorting by length first means
 * the most specific entry answers.
 */
function currentSectionName(pathname: string): string | null {
	const match = [...mainNavigation, ...bottomNavigation]
		.filter((item) => pathname.startsWith(item.href))
		.sort((a, b) => b.href.length - a.href.length)[0];

	return match?.name ?? null;
}

/**
 * The dashboard header.
 *
 * ## What it is for now
 *
 * Tools, and only tools: the sidebar trigger, where you are, search, and the
 * theme. The account menu moved to the foot of the sidebar - it was sitting
 * beside Search and the theme toggle, which put "who am I" and "what can I do"
 * in the same corner and left the sidebar ending in dead space.
 *
 * The section name fills the gap that created. It matters more than it looks:
 * when the sidebar is collapsed to a rail, or is a closed Sheet on a phone,
 * nothing else on screen says which part of the app you are in.
 */
export function TopBar() {
	const pathname = usePathname();
	const openSearch = useSearchStore((state) => state.open);
	const sectionName = currentSectionName(pathname);

	return (
		<header className="sticky top-0 z-40 flex h-16 w-full flex-none items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/60 sm:px-6">
			{/* Mobile only. On desktop the collapse control lives in the sidebar
			    footer, where it belongs - it is a property of the sidebar. But on a
			    phone the sidebar is a sheet that is either open or entirely gone, so
			    a control inside it cannot be what opens it. This is the only way in. */}
			<SidebarTrigger className="text-muted-foreground hover:text-foreground md:hidden" />

			<Separator
				orientation="vertical"
				className="mr-1 h-5 md:hidden"
				aria-hidden="true"
			/>

			{sectionName && (
				<h1 className="truncate text-sm font-semibold text-on-surface sm:text-base">
					{sectionName}
				</h1>
			)}

			{/* Pushes everything after it to the right without a fixed width, so the
			    title can take whatever room it needs on a narrow screen. */}
			<div className="flex-1" />

			<div className="flex items-center gap-2 sm:gap-3">
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
					className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-surface-container-lowest px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted md:flex lg:w-80"
				>
					<Search className="size-4 shrink-0" aria-hidden="true" />
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
					<Search className="size-5" />
				</Button>

				<ThemeToggle />
			</div>

			<GlobalSearchDialog />
		</header>
	);
}
