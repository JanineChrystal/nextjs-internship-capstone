import { useMemo, useState } from "react";
import { useTaskStore } from "@/stores/use-task-store";

export function useGridView() {
	const { tasks, bulkDeleteTasks, bulkCompleteTasks } = useTaskStore();

	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
		new Set(),
	);
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const isAllSelected =
		tasks.length > 0 && selectedTaskIds.size === tasks.length;
	const isIndeterminate =
		selectedTaskIds.size > 0 && selectedTaskIds.size < tasks.length;

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
		} else {
			setSelectedTaskIds(new Set());
		}
	};

	const handleToggleSelect = (taskId: string, checked: boolean) => {
		setSelectedTaskIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(taskId);
			else next.delete(taskId);
			return next;
		});
	};

	const handleClearSelection = () => setSelectedTaskIds(new Set());

	const handleBulkDelete = () => {
		bulkDeleteTasks(selectedTaskIds);
		handleClearSelection();
	};

	const handleBulkComplete = () => {
		bulkCompleteTasks(selectedTaskIds);
		handleClearSelection();
	};

	const handleSort = (key: string) => {
		setSortConfig((current) => {
			if (current?.key === key) {
				if (current.direction === "asc") return { key, direction: "desc" };
				return null; // Unsort
			}
			return { key, direction: "asc" };
		});
	};

	const sortedTasks = useMemo(() => {
		if (!sortConfig) return tasks;

		return [...tasks].sort((a, b) => {
			const aValue = a[sortConfig.key as keyof typeof a];
			const bValue = b[sortConfig.key as keyof typeof b];

			if (aValue === bValue) return 0;
			if (aValue === undefined || aValue === null) return 1;
			if (bValue === undefined || bValue === null) return -1;

			if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
			if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [tasks, sortConfig]);

	return {
		tasks: sortedTasks,
		sortConfig,
		selectedTaskIds,
		isAllSelected,
		isIndeterminate,
		handleSort,
		handleSelectAll,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
	};
}
