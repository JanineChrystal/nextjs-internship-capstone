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
 * category badge component - extends TagBadge with database-driven colors by
 * resolving category scopes and managing deduplicated, scoped fetch requests
 * without passing object references into dependency arrays.
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
