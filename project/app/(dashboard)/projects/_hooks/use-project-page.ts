import { useCallback, useMemo, useState } from "react";
import type { FilterField } from "@/components/ui/filters/filter-popover";
import { TASK_PRIORITIES, TASK_TAGS } from "@/lib/validations/task-schema";
import { useBoardStore } from "@/stores/use-board-store";
import type { ProjectViewType } from "../[id]/page";

export function useProjectPage() {
	const [activeView, setActiveView] = useState<ProjectViewType>("board");
	const [filters, setFilters] = useState<Record<string, string[]>>({});

	const handleToggleFilter = useCallback((fieldId: string, value: string) => {
		setFilters((prev) => {
			const currentValues = prev[fieldId] || [];
			const nextValues = currentValues.includes(value)
				? currentValues.filter((v) => v !== value)
				: [...currentValues, value];

			return {
				...prev,
				[fieldId]: nextValues,
			};
		});
	}, []);

	const handleResetFilters = useCallback(() => setFilters({}), []);

	const boardColumns = useBoardStore((state) => state.columns);

	const filterFields: FilterField[] = useMemo(() => {
		const dynamicStatuses = boardColumns.map((col) => col.title);

		return [
			{
				id: "my-tasks",
				label: "My Tasks",
				options: [{ label: "Show only my tasks", value: "true" }],
			},
			{ id: "status", label: "Status", options: dynamicStatuses },
			{ id: "priority", label: "Priority", options: TASK_PRIORITIES },
			{ id: "board", label: "Board", options: dynamicStatuses },
			{ id: "tag", label: "Tag", options: TASK_TAGS },
		];
	}, [boardColumns]);

	return {
		activeView,
		filters,
		filterFields,
		setActiveView,
		handleToggleFilter,
		handleResetFilters,
	};
}
