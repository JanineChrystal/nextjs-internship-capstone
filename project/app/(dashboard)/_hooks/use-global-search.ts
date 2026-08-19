"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { globalSearchAction } from "@/lib/actions/search-actions";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from "@/lib/constants/search";
import type { SearchResult, SearchResults } from "@/lib/types/search";
import { useSearchStore } from "@/stores/use-search-store";

const EMPTY: SearchResults = {
	projects: [],
	tasks: [],
	people: [],
	hasMore: false,
};

/**
 * The global search palette's state.
 *
 * Two problems here are worth more than the rest of the file put together, and
 * both are invisible until the network is slow.
 *
 * ## 1. Debouncing
 *
 * Typing "kanban" fires six searches if every keystroke queries. The timer is
 * reset on each change and only the pause at the end runs a query.
 *
 * ## 2. Out-of-order responses
 *
 *     type "ka"    → request A ─────────────────────────┐ (slow)
 *     type "kanban"→ request B ──────┐ (fast)           │
 *                                    ▼                  ▼
 *                         B lands: shows kanban   A lands: OVERWRITES
 *                                                 with results for "ka"
 *
 * The box then shows results that do not match what is in it, and nothing looks
 * broken - it just looks wrong. Debouncing reduces this but cannot fix it: two
 * requests can always be in flight if one is slow enough.
 *
 * The fix is a monotonic request id. Each search takes the next number, and a
 * response is only applied if its number is still the latest one issued. A late
 * reply from an abandoned query is dropped rather than rendered.
 */
export function useGlobalSearch() {
	const router = useRouter();

	// External store - shared with the top bar's trigger.
	const isOpen = useSearchStore((state) => state.isOpen);
	const closeStore = useSearchStore((state) => state.close);
	const toggleStore = useSearchStore((state) => state.toggle);

	// Local state
	const [term, setTerm] = useState("");
	const [results, setResults] = useState<SearchResults>(EMPTY);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	// Refs
	const requestIdRef = useRef(0);

	// Derived
	const trimmed = term.trim();
	const isQueryable = trimmed.length >= SEARCH_MIN_LENGTH;

	/**
	 * Every hit in one array, in the order they appear on screen.
	 *
	 * Keyboard navigation needs a single sequence to move an index through;
	 * keeping the groups separate would mean the arrow keys having to know how
	 * many rows each group has and where each one starts.
	 */
	const flat: SearchResult[] = useMemo(
		() => [...results.projects, ...results.tasks, ...results.people],
		[results],
	);

	const hasResults = flat.length > 0;

	// Handlers
	const close = useCallback(() => {
		closeStore();
		setTerm("");
		setResults(EMPTY);
		setError(null);
		setActiveIndex(0);
		// Bumped so any request still in flight is ignored when it lands - without
		// this, closing and reopening quickly can flash the previous query's hits.
		requestIdRef.current += 1;
	}, [closeStore]);

	const select = useCallback(
		(result: SearchResult) => {
			close();
			router.push(result.href);
		},
		[close, router],
	);

	const moveActive = useCallback(
		(delta: number) => {
			if (flat.length === 0) return;
			// Wraps at both ends, so holding ArrowDown cycles rather than sticking
			// on the last row.
			setActiveIndex(
				(current) => (current + delta + flat.length) % flat.length,
			);
		},
		[flat.length],
	);

	// Effects
	useEffect(() => {
		if (!isOpen) return;

		if (!isQueryable) {
			setResults(EMPTY);
			setIsSearching(false);
			setError(null);
			return;
		}

		setIsSearching(true);
		const requestId = ++requestIdRef.current;

		const timer = setTimeout(async () => {
			const response = await globalSearchAction(trimmed);

			// The guard. A response from an abandoned query is discarded.
			if (requestId !== requestIdRef.current) return;

			if (!response.success || !response.data) {
				setError(response.error ?? "Search is unavailable right now");
				setResults(EMPTY);
			} else {
				setError(null);
				setResults(response.data);
			}

			setActiveIndex(0);
			setIsSearching(false);
		}, SEARCH_DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [isOpen, trimmed, isQueryable]);

	// Cmd+K / Ctrl+K from anywhere, and Escape to leave.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				toggleStore();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [toggleStore]);

	return {
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
	};
}
