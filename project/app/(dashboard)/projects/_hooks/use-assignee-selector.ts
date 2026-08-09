import * as React from "react";
import type { Assignee } from "@/types/task";
import { PROJECT_MEMBERS } from "../_constants/project";

export function useAssigneeSelector(
	assignees: Assignee[],
	onAssigneesChange: (assignees: Assignee[]) => void,
) {
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");

	const handleSelect = (member: Assignee) => {
		const isAssigned = assignees.some((a) => a.name === member.name);
		if (isAssigned) {
			onAssigneesChange(assignees.filter((a) => a.name !== member.name));
		} else {
			onAssigneesChange([...assignees, member]);
		}
	};

	const filteredMembers = PROJECT_MEMBERS.filter(
		(member) =>
			member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return {
		open,
		setOpen,
		searchQuery,
		setSearchQuery,
		handleSelect,
		filteredMembers,
	};
}
