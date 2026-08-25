"use client";

import { Loader2, Search, SearchX } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SEARCH_MIN_LENGTH } from "@/lib/constants/search";
import type { SearchResult } from "@/lib/types/search";
import { cn } from "@/lib/utils";
import { SEARCH_GROUP_CONFIG, SEARCH_GROUPS } from "../../../_constants/search";
import { useGlobalSearch } from "../../../_hooks/use-global-search";

/**
 * global search dialog component - implements a search palette using the standard Dialog primitive for better mobile responsiveness and focus trapping, avoiding external dependencies like cmdk since filtering is handled server-side.
 */

function ResultRow({
	result,
	isActive,
	onSelect,
	onHover,
}: {
	result: SearchResult;
	isActive: boolean;
	onSelect: () => void;
	onHover: () => void;
}) {
	const Icon = SEARCH_GROUP_CONFIG[result.kind].icon;

	return (
		<button
			type="button"
			onMouseMove={onHover}
			onClick={onSelect}
			data-active={isActive}
			className={cn(
				"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
				isActive ? "bg-primary/10" : "hover:bg-surface-container",
			)}
		>
			<Icon
				className={cn(
					"h-4 w-4 shrink-0",
					isActive ? "text-primary" : "text-secondary",
				)}
				aria-hidden="true"
			/>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-sm text-on-surface">{result.title}</span>
				{result.subtitle && (
					<span className="truncate text-xs text-secondary">
						{result.subtitle}
					</span>
				)}
			</span>
		</button>
	);
}

export function GlobalSearchDialog() {
	const {
		isOpen,
		term,
		results,
		flat,
		hasResults,
		isSearching,
		error,
		activeIndex,
		isQueryable,
		setTerm,
		setActiveIndex,
		close,
		select,
		moveActive,
	} = useGlobalSearch();

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			moveActive(1);
			return;
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			moveActive(-1);
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			const result = flat[activeIndex];
			if (result) select(result);
		}
	};

	// unified selection cursor - tracks a continuous index across all visual groups to enable seamless arrow key navigation.
	let cursor = -1;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
			<DialogContent
				showCloseButton={false}
				className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
				onKeyDown={handleKeyDown}
			>
				{/* accessible title - provides a hidden title required by the Dialog primitive for screen readers. */}
				<DialogTitle className="sr-only">Search</DialogTitle>

				<div className="flex items-center gap-3 border-b border-border px-4">
					{isSearching ? (
						<Loader2
							className="h-4 w-4 shrink-0 animate-spin text-secondary"
							aria-hidden="true"
						/>
					) : (
						<Search
							className="h-4 w-4 shrink-0 text-secondary"
							aria-hidden="true"
						/>
					)}
					{/* auto-focusing input - captures input immediately when the palette opens, relying on the dialog's focus trap to prevent disruption to the underlying page. */}
					<input
						autoFocus
						value={term}
						onChange={(event) => setTerm(event.target.value)}
						placeholder="Search projects, tasks and people..."
						aria-label="Search projects, tasks and people"
						className="h-14 w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
					/>
					<kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-secondary sm:block">
						Esc
					</kbd>
				</div>

				<div className="max-h-[60vh] overflow-y-auto p-2">
					{error ? (
						<p className="px-3 py-8 text-center text-sm text-error">{error}</p>
					) : !isQueryable ? (
						<p className="px-3 py-8 text-center text-sm text-secondary">
							Type at least {SEARCH_MIN_LENGTH} characters to search.
						</p>
					) : isSearching && !hasResults ? (
						<p className="px-3 py-8 text-center text-sm text-secondary">
							Searching...
						</p>
					) : !hasResults ? (
						<div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
							<SearchX className="h-6 w-6 text-secondary" aria-hidden="true" />
							<p className="text-sm text-secondary">
								Nothing matches &quot;{term.trim()}&quot;.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{SEARCH_GROUPS.map(({ kind, resultsKey }) => {
								const group = results[resultsKey];
								if (group.length === 0) return null;

								return (
									<section key={kind} className="flex flex-col gap-0.5">
										<h2 className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-secondary">
											{SEARCH_GROUP_CONFIG[kind].label}
										</h2>
										{group.map((result) => {
											cursor += 1;
											const index = cursor;
											return (
												<ResultRow
													key={`${result.kind}-${result.id}`}
													result={result}
													isActive={index === activeIndex}
													onSelect={() => select(result)}
													onHover={() => setActiveIndex(index)}
												/>
											);
										})}
									</section>
								);
							})}

							{results.hasMore && (
								<p className="px-3 pb-1 text-xs text-secondary">
									Showing the closest matches. Keep typing to narrow it down.
								</p>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
