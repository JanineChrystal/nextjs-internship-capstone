import { useMemo, useState } from "react";
import { useTaskStore } from "@/stores/use-task-store";

export function useGridView(externalFilters?: Record<string, string[]>) {
	// External Stores
	const { tasks, bulkDeleteTasks, bulkCompleteTasks } = useTaskStore();

	// Local State
	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
		new Set(),
	);
	const [isSelectionModeActive, setIsSelectionModeActive] =
		useState<boolean>(false);
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);
	const [internalFilters, setInternalFilters] = useState<
		Record<string, string[]>
	>({});

	const filters = externalFilters || internalFilters;

	// Derived State & Memoized Calculations
	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			for (const [key, selectedValues] of Object.entries(filters)) {
				if (selectedValues.length === 0) continue; // no filter active for this category

				const taskValue = task[key as keyof typeof task];
				// Handle tags array if taskValue is an array (although grid task schema says it's a single enum, we use String just in case)
				if (Array.isArray(taskValue)) {
					if (!taskValue.some((val) => selectedValues.includes(String(val)))) {
						return false;
					}
				} else {
					if (!selectedValues.includes(String(taskValue))) {
						return false;
					}
				}
			}
			return true;
		});
	}, [tasks, filters]);

	const sortedTasks = useMemo(() => {
		if (!sortConfig) return filteredTasks;

		return [...filteredTasks].sort((a, b) => {
			const aValue = a[sortConfig.key as keyof typeof a];
			const bValue = b[sortConfig.key as keyof typeof b];

			if (aValue === bValue) return 0;
			if (aValue === undefined || aValue === null) return 1;
			if (bValue === undefined || bValue === null) return -1;

			if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
			if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [filteredTasks, sortConfig]);

	const isAllSelected =
		sortedTasks.length > 0 && selectedTaskIds.size === sortedTasks.length;
	const isIndeterminate =
		selectedTaskIds.size > 0 && selectedTaskIds.size < sortedTasks.length;

	// Action Handlers
	const handleToggleSelectionMode = (checked: boolean) => {
		setIsSelectionModeActive(checked);
		if (!checked) {
			setSelectedTaskIds(new Set());
		}
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedTaskIds(new Set(sortedTasks.map((t) => t.id)));
			setIsSelectionModeActive(true);
		} else {
			setSelectedTaskIds(new Set());
			setIsSelectionModeActive(false);
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

	const handleClearSelection = () => {
		setSelectedTaskIds(new Set());
		setIsSelectionModeActive(false);
	};

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

	const handleToggleFilter = (fieldId: string, value: string) => {
		setInternalFilters((prev) => {
			const currentValues = prev[fieldId] || [];
			const nextValues = currentValues.includes(value)
				? currentValues.filter((v) => v !== value)
				: [...currentValues, value];

			return {
				...prev,
				[fieldId]: nextValues,
			};
		});
	};

	const handleResetFilters = () => {
		setInternalFilters({});
	};

	return {
		tasks: sortedTasks,
		sortConfig,
		selectedTaskIds,
		isSelectionModeActive,
		isAllSelected,
		isIndeterminate,
		filters,
		handleSort,
		handleToggleSelectionMode,
		handleSelectAll,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
		handleToggleFilter,
		handleResetFilters,
	};
}
