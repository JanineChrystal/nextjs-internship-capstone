import type { ReactNode } from "react";

export interface ColumnDef {
	key: string;
	title: string;
	className?: string; // e.g. "w-[200px]" or "flex-1"
	renderHeader?: () => ReactNode;
}
