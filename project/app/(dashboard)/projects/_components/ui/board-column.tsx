import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
	title: string;
	count: number;
	dotColor: string;
	children: React.ReactNode;
	isActive?: boolean;
}

export function BoardColumn({
	title,
	count,
	dotColor,
	children,
	isActive,
}: BoardColumnProps) {
	return (
		<div
			className={cn(
				"shrink-0 w-80 flex flex-col gap-4 bg-muted/30 border border-border rounded-xl p-4 h-full",
				isActive && "ring-1 ring-primary/20 border-primary/20",
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
					<span className={cn("w-2 h-2 rounded-full", dotColor)} />
					{title} <span className="text-muted-foreground ml-1">{count}</span>
				</h3>
				<Button className="text-muted-foreground hover:text-foreground transition-colors">
					<MoreHorizontal className="w-5 h-5" />
				</Button>
			</div>

			{/* task container - holds the scrollable list of task cards. */}
			<div className="flex flex-col gap-3 overflow-y-auto">{children}</div>

			{/* add task button - triggers the creation of a new task in this column. */}
			<Button className="w-full py-2.5 mt-auto flex items-center justify-center gap-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-sm font-medium border border-dashed border-border">
				<Plus className="w-4 h-4" /> Add Tasks
			</Button>
		</div>
	);
}
