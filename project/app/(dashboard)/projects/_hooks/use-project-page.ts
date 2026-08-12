import { useCallback, useMemo, useState } from "react";
import type { FilterField } from "@/components/ui/filters/filter-popover";
import {
	TASK_BOARDS,
	TASK_PRIORITIES,
	TASK_STATUSES,
	TASK_TAGS,
} from "@/lib/validations/task-schema";
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

	const filterFields: FilterField[] = useMemo(
		() => [
			{ id: "status", label: "Status", options: TASK_STATUSES },
			{ id: "priority", label: "Priority", options: TASK_PRIORITIES },
			{ id: "board", label: "Board", options: TASK_BOARDS },
			{ id: "tag", label: "Tag", options: TASK_TAGS },
		],
		[],
	);

	return {
		activeView,
		filters,
		filterFields,
		setActiveView,
		handleToggleFilter,
		handleResetFilters,
	};
}
