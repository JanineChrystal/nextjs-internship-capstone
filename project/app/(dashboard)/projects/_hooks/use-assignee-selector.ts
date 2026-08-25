import { useParams } from "next/navigation";
import * as React from "react";
import { getProjectMembersAction } from "@/lib/actions/task-assignee-actions";
import type { Assignee } from "@/types/task";

export function useAssigneeSelector(
	assignees: Assignee[],
	onAssigneesChange: (assignees: Assignee[]) => void,
) {
	const params = useParams();
	const projectId = params?.id as string;

	// Local State
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [projectMembers, setProjectMembers] = React.useState<Assignee[]>([]);

	// Derived State
	const filteredMembers = projectMembers.filter(
		(member) =>
			member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Handlers
	const handleSelect = (member: Assignee) => {
		const isAssigned = assignees.some((a) => a.userId === member.userId);
		if (isAssigned) {
			onAssigneesChange(assignees.filter((a) => a.userId !== member.userId));
		} else {
			onAssigneesChange([...assignees, member]);
		}
	};

	// Effects
	React.useEffect(() => {
		if (!projectId) return;
		getProjectMembersAction(projectId).then((result) => {
			if (result.success && result.data) {
				setProjectMembers(
					result.data.map((member) => ({
						userId: member.userId,
						name: member.name,
						email: member.email,
						avatarUrl: member.avatarUrl,
					})),
				);
			}
		});
	}, [projectId]);

	return {
		open,
		setOpen,
		searchQuery,
		setSearchQuery,
		filteredMembers,
		handleSelect,
	};
}
