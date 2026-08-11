"use client";

import { UserButton } from "@clerk/nextjs";
import { Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/buttons/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isSearchOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isSearchOpen]);

	return (
		<header className="flex-none flex items-center justify-between w-full h-16 px-6 bg-transparent sticky top-0 z-40">
			{/* Left Side: Sidebar Toggle */}
			<div
				className={`flex items-center gap-4 ${isSearchOpen ? "hidden md:flex" : "flex-1"}`}
			>
				<SidebarTrigger className="text-foreground" />
			</div>

			{/* Right Side: Search + Actions */}
			<div
				className={`flex items-center gap-4 ${isSearchOpen ? "w-full md:w-auto" : ""}`}
			>
				{/* Search Container */}
				<div
					className={`relative flex items-center ${isSearchOpen ? "w-full" : "w-auto"}`}
				>
					{/* Mobile Version: Search Icon Toggle */}
					{!isSearchOpen && (
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden text-muted-foreground hover:text-foreground"
							onClick={() => setIsSearchOpen(true)}
						>
							<Search className="w-5 h-5" />
						</Button>
					)}

					{/* Search Input */}
					<div
						className={`relative w-full md:w-62.5 lg:w-87.5 transition-all duration-300 ${isSearchOpen ? "block" : "hidden md:block"}`}
					>
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 hidden md:block" />

						{isSearchOpen && (
							<button
								type="button"
								className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground md:hidden hover:text-foreground"
								onClick={() => setIsSearchOpen(false)}
								onMouseDown={(e) => e.preventDefault()}
							>
								<X className="w-4 h-4" />
							</button>
						)}

						<input
							ref={searchInputRef}
							type="text"
							placeholder="Search projects..."
							onBlur={() => setIsSearchOpen(false)}
							className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground transition-all"
						/>
					</div>
				</div>

				{/* User Actions: Theme & Profile */}
				<div
					className={`items-center gap-4 shrink-0 ${isSearchOpen ? "hidden md:flex" : "flex"}`}
				>
					<ThemeToggle />
					<UserButton
						showName
						appearance={{
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
				</div>
			</div>
		</header>
	);
}
