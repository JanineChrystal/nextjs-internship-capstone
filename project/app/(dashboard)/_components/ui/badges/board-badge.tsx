import { cn } from "@/lib/utils";
import type { TaskBoard } from "@/types/task";
import {
	BOARD_CONFIG,
	getDynamicBadgeColor,
} from "../../../projects/_constants/badges";

interface BoardBadgeProps {
	board: TaskBoard;
	className?: string;
}

export function BoardBadge({ board, className }: BoardBadgeProps) {
	const colorClass = BOARD_CONFIG[board] || getDynamicBadgeColor(board);

	return (
		<div
			className={cn(
				"inline-flex items-center px-2.5 py-1 rounded border border-outline-variant/30 bg-surface-container-high text-secondary text-xs font-medium whitespace-nowrap",
				colorClass,
				className,
			)}
		>
			{board}
		</div>
	);
}
