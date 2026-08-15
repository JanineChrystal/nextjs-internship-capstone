import { CheckCircle, Circle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import type { GridTask } from "@/types/task";

interface TaskChecklistProps {
	taskData: Partial<GridTask>;
	addChecklistItem: () => void;
	updateChecklistItem: (
		id: string,
		updates: Partial<{ title: string; completed: boolean }>,
	) => void;
	commitChecklistItem: (id: string, title: string) => void;
	toggleChecklistItem: (id: string, completed: boolean) => void;
	removeChecklistItem: (id: string) => void;
}

export function TaskChecklist({
	taskData,
	addChecklistItem,
	updateChecklistItem,
	commitChecklistItem,
	toggleChecklistItem,
	removeChecklistItem,
}: TaskChecklistProps) {
	return (
		<div className="space-y-3 pt-4 border-t border-outline-variant/50">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">Checklist</h3>
				<span className="text-xs text-secondary">
					{
						(taskData.checklist || []).filter(
							(i: { completed: boolean }) => i.completed,
						).length
					}
					/{(taskData.checklist || []).length}
				</span>
			</div>
			<div className="space-y-2">
				{(taskData.checklist || []).map(
					(item: { id: string; title: string; completed: boolean }) => (
						<div key={item.id} className="flex items-center gap-3 group">
							<button
								type="button"
								onClick={() => toggleChecklistItem(item.id, !item.completed)}
								className="text-secondary hover:text-primary transition-colors focus:outline-none"
								aria-label="Toggle checklist item"
							>
								{item.completed ? (
									<CheckCircle className="h-5 w-5 text-primary" />
								) : (
									<Circle className="h-5 w-5" />
								)}
							</button>
							<Input
								value={item.title}
								onChange={(e) =>
									updateChecklistItem(item.id, { title: e.target.value })
								}
								onBlur={() => commitChecklistItem(item.id, item.title)}
								className={`flex-1 border-none bg-transparent shadow-none px-0 focus-visible:ring-0 ${
									item.completed ? "line-through text-secondary" : ""
								}`}
								placeholder="Checklist item..."
								aria-label="Checklist item"
							/>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeChecklistItem(item.id)}
								className="opacity-0 group-hover:opacity-100 h-8 w-8 text-error hover:bg-error/10 transition-opacity"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					),
				)}
				<Button
					variant="ghost"
					size="sm"
					className="text-primary hover:text-primary/80 hover:bg-primary/10 px-2 -ml-2"
					onClick={addChecklistItem}
				>
					<Plus className="h-4 w-4 mr-1" />
					Add Item
				</Button>
			</div>
		</div>
	);
}
