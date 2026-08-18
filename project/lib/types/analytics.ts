import type { LucideIcon } from "lucide-react";

/**
 * Describes one stat tile without saying what its value is.
 *
 * `id` is constrained to the keys of `T` whose values are numbers, so a tile can
 * only ever point at a field that actually exists on the DTO it will be rendered
 * against. Renaming a DTO field then breaks the config at compile time instead
 * of quietly rendering "undefined" in production.
 */
export interface StatCardConfig<T> {
	id: NumericKeyOf<T>;
	label: string;
	unit?: string;
	icon: LucideIcon;
	hint?: string;
}

type NumericKeyOf<T> = {
	[K in keyof T]: T[K] extends number ? K : never;
}[keyof T];
