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
 * global search hook - manages state, debouncing, and keyboard navigation for the global search palette.
 * uses a monotonic request id to prevent stale out-of-order network responses from overwriting newer search results.
 */
export function useGlobalSearch() {
	const router = useRouter();

	// shared state store - links visibility state with external triggers like the top bar search button.
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

	/** flattened results - combines grouped search hits into a single sequential array to simplify arrow-key navigation. */
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
		// request invalidation - increments the request id on close to ignore any in-flight requests and prevent flashing old results on reopen.
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
			// circular navigation - wraps the active index to enable continuous cycling through results.
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

			// stale response guard - discards responses if a newer request has been initiated.
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

	// global keyboard shortcuts - binds Cmd/Ctrl+K to toggle the search palette globally.
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
