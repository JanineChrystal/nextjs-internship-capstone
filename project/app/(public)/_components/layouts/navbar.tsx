"use client";

import { Menu, Rocket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
	LANDING_FEATURE_MENU,
	LANDING_NAV,
	LANDING_SECTIONS,
	OBSERVED_SECTION_IDS,
} from "../../_constants/nav";
import { useSectionLink } from "../../_hooks/use-section-link";
import { useSectionSpy } from "../../_hooks/use-section-spy";

/**
 * The one-page header.
 *
 * Every entry is an in-page anchor, so each one is rendered as a real `<a>` with
 * a real `href="#section"` and the smooth scroll layered on top by
 * `preventDefault`. Two things fall out of that which a plain onClick handler
 * would lose: the links still work if the JavaScript fails to load, and hovering
 * one shows the destination in the status bar the way a link is supposed to.
 */
export function Navbar() {
	const { activeId, scrollToSection } = useSectionSpy(OBSERVED_SECTION_IDS);
	const { hrefFor, handleAnchor: onAnchor } = useSectionLink(scrollToSection);
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Closing the mobile sheet happens either way: on the landing page the scroll
	// is about to run underneath it, and off it the page is about to change.
	const handleAnchor = (
		event: React.MouseEvent<HTMLAnchorElement>,
		sectionId: string,
	) => {
		onAnchor(event, sectionId);
		setIsMobileOpen(false);
	};

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="flex items-center gap-2 font-semibold text-on-surface"
				>
					<Rocket className="h-5 w-5 text-primary" aria-hidden="true" />
					<span>Takda PH</span>
				</Link>

				{/* Desktop navigation */}
				<NavigationMenu className="hidden md:flex" viewport={false}>
					<NavigationMenuList>
						<NavigationMenuItem>
							<NavigationMenuTrigger
								className={cn(
									"bg-transparent",
									activeId === LANDING_SECTIONS.features && "text-primary",
								)}
							>
								Features
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-lg grid-cols-2 gap-1 p-2">
									{LANDING_FEATURE_MENU.map((entry) => (
										<li key={entry.label}>
											<NavigationMenuLink asChild>
												<a
													href={hrefFor(entry.sectionId)}
													onClick={(event) =>
														handleAnchor(event, entry.sectionId)
													}
													className="flex select-none flex-col gap-1 rounded-lg p-3 no-underline outline-none transition-colors hover:bg-muted focus:bg-muted"
												>
													<span className="flex items-center gap-2 text-sm font-medium text-on-surface">
														{entry.icon && (
															<entry.icon
																className="h-4 w-4 text-primary"
																aria-hidden="true"
															/>
														)}
														{entry.label}
													</span>
													<span className="text-xs leading-snug text-secondary">
														{entry.description}
													</span>
												</a>
											</NavigationMenuLink>
										</li>
									))}
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>

						{LANDING_NAV.filter(
							(entry) => entry.sectionId !== LANDING_SECTIONS.features,
						).map((entry) => (
							<NavigationMenuItem key={entry.sectionId}>
								<NavigationMenuLink asChild>
									<a
										href={hrefFor(entry.sectionId)}
										onClick={(event) => handleAnchor(event, entry.sectionId)}
										className={cn(
											"inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted",
											activeId === entry.sectionId
												? "text-primary"
												: "text-on-surface",
										)}
									>
										{entry.label}
									</a>
								</NavigationMenuLink>
							</NavigationMenuItem>
						))}
					</NavigationMenuList>
				</NavigationMenu>

				<div className="flex items-center gap-2">
					<Button asChild variant="ghost" size="lg" className="hidden sm:flex">
						<Link href="/sign-in">Sign in</Link>
					</Button>
					<Button asChild size="lg">
						<Link href="/sign-up">Get started</Link>
					</Button>

					{/* Mobile navigation. The same Sheet primitive as the drawers, from
					    the left, so the page has one overlay implementation rather than
					    a bespoke mobile menu. */}
					<Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon-lg"
								className="md:hidden"
								aria-label="Open menu"
							>
								<Menu />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72 p-0">
							<SheetHeader className="border-b border-border p-4">
								<SheetTitle>Menu</SheetTitle>
							</SheetHeader>
							<nav className="flex flex-col p-2">
								{LANDING_NAV.map((entry) => (
									<a
										key={entry.sectionId}
										href={hrefFor(entry.sectionId)}
										onClick={(event) => handleAnchor(event, entry.sectionId)}
										className={cn(
											"rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
											activeId === entry.sectionId
												? "text-primary"
												: "text-on-surface",
										)}
									>
										{entry.label}
									</a>
								))}
								<Link
									href="/sign-in"
									className="rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-muted sm:hidden"
								>
									Sign in
								</Link>
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
