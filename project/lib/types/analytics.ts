import type { LucideIcon } from "lucide-react";

/**
 * stat card config - describes one stat tile without hardcoding its value,
 * constraining `id` to numeric keys of `T` to ensure compile-time safety
 * when rendering against DTOs, preventing silent rendering of undefined values.
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
