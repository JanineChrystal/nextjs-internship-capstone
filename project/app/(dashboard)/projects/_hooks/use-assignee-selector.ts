import * as React from "react";
import type { Assignee } from "@/types/task";
import { PROJECT_MEMBERS } from "../_constants/project";

export function useAssigneeSelector(
	assignees: Assignee[],
	onAssigneesChange: (assignees: Assignee[]) => void,
) {
	// Local State
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");

	// Derived State
	const filteredMembers = PROJECT_MEMBERS.filter(
		(member) =>
			member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Handlers
	const handleSelect = (member: Assignee) => {
		const isAssigned = assignees.some((a) => a.name === member.name);
		if (isAssigned) {
			onAssigneesChange(assignees.filter((a) => a.name !== member.name));
		} else {
			onAssigneesChange([...assignees, member]);
		}
	};

	return {
		open,
		setOpen,
		searchQuery,
		setSearchQuery,
		filteredMembers,
		handleSelect,
	};
}
