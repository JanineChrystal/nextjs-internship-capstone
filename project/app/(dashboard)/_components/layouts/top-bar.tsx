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
 * current section name - resolves the active route to its corresponding navigation entry by selecting the longest matching path for maximum specificity.
 */
function currentSectionName(pathname: string): string | null {
	const match = [...mainNavigation, ...bottomNavigation]
		.filter((item) => pathname.startsWith(item.href))
		.sort((a, b) => b.href.length - a.href.length)[0];

	return match?.name ?? null;
}

/**
 * top bar component - provides a streamlined dashboard header focused solely on global tools (search, theme, navigation triggers) and clear section context.
 */
export function TopBar() {
	const pathname = usePathname();
	const openSearch = useSearchStore((state) => state.open);
	const sectionName = currentSectionName(pathname);

	return (
		<header className="sticky top-0 z-40 flex h-16 w-full flex-none items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/60 sm:px-6">
			{/* mobile sidebar trigger - provides the sole entry point to open the navigation sheet on small screens where the sidebar is hidden by default. */}
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

			{/* flexible spacer - pushes trailing controls to the right edge while allowing the section title to consume available space fluidly. */}
			<div className="flex-1" />

			<div className="flex items-center gap-2 sm:gap-3">
				{/* search trigger button - styles a semantic button to look like an input field, acting purely as a trigger for the global search palette rather than capturing typing directly. */}
				<button
					type="button"
					onClick={openSearch}
					aria-label="Search projects, tasks and people"
					className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-surface-container-lowest px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted md:flex lg:w-80"
				>
					<Search className="size-4 shrink-0" aria-hidden="true" />
					<span className="flex-1 truncate">Search...</span>
					{/*
					  keyboard shortcut hint - displays the search shortcut explicitly on large screens where physical keyboards are expected.
					*/}
					<kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] lg:block">
						Ctrl K
					</kbd>
				</button>

				{/* mobile search trigger - collapses the fake search input into a compact icon button on narrow screens to preserve header space. */}
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
