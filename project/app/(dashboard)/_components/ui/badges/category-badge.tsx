"use client";

import { useEffect } from "react";
import type { CategoryScope } from "@/lib/types/category";
import { getCategoryColorKey, getCategoryScopeKey } from "@/lib/utils/category";
import { useCategoryStore } from "@/stores/use-category-store";
import { TagBadge } from "./tag-badge";

interface CategoryBadgeProps {
	name: string;
	scope: CategoryScope | null;
	className?: string;
}

/**
 * A tag badge that knows its colour comes from the database.
 *
 * Kept separate from TagBadge so the presentational badge stays free of data
 * access - TagBadge also renders job roles and access levels, which have no
 * Categories row. This component is the one place that joins a category name to
 * the colour someone chose for it, which is why editing a colour in Manage
 * Categories now repaints every badge instead of only newly created ones.
 *
 * Fetching is requested per badge but performed once per scope: the store holds
 * one promise per scope key, so a board rendering forty cards issues a single
 * request rather than forty.
 *
 * The scope is destructured to primitives before it reaches the effect. Callers
 * build the object inline, so a fresh reference arrives on every render and an
 * effect depending on the object itself would re-run forever.
 */
export function CategoryBadge({ name, scope, className }: CategoryBadgeProps) {
	const kind = scope?.kind;
	const id = scope?.id;
	const type = scope?.type;
	const scopeKey = scope ? getCategoryScopeKey(scope) : null;

	const ensureCategoryStyles = useCategoryStore(
		(state) => state.ensureCategoryStyles,
	);
	const color = useCategoryStore((state) =>
		scopeKey
			? state.categoryStyles[scopeKey]?.[getCategoryColorKey(name)]
			: undefined,
	);

	useEffect(() => {
		if (!kind || !id || !type) return;
		ensureCategoryStyles({ kind, id, type });
	}, [ensureCategoryStyles, kind, id, type]);

	return <TagBadge tag={name} color={color} className={className} />;
}
