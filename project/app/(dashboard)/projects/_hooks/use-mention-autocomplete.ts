"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProjectMembersAction } from "@/lib/actions/task-assignee-actions";
import type { ProjectMemberOutputDTO } from "@/lib/dtos/project-member-dto";
import {
	applyMentionAtCaret,
	readMentionQuery,
	toMentionHandle,
} from "@/lib/utils/mentions";

/**
 * use-mention-autocomplete hook - provides mention suggestions scoped strictly to
 * the project's current members to prevent users from mentioning invalid or
 * unauthorized handles.
 */
export function useMentionAutocomplete(
	projectId: string | undefined,
	value: string,
	onChange: (next: string) => void,
) {
	const [members, setMembers] = useState<ProjectMemberOutputDTO[]>([]);
	const [caret, setCaret] = useState(0);
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);

	const query = readMentionQuery(value, caret);

	const suggestions = useMemo(() => {
		if (query === null) return [];
		return members
			.filter((member) => {
				const handle = toMentionHandle(member.email);
				return (
					handle.startsWith(query) || member.name.toLowerCase().includes(query)
				);
			})
			.slice(0, 5);
	}, [members, query]);

	const isOpen = query !== null && suggestions.length > 0;

	const select = useCallback(
		(member: ProjectMemberOutputDTO) => {
			const result = applyMentionAtCaret(
				value,
				caret,
				toMentionHandle(member.email),
			);
			onChange(result.body);

			// caret position restoration - resets the cursor location after mention insertion to prevent jumping to the end of the input.
			requestAnimationFrame(() => {
				const node = inputRef.current;
				if (!node) return;
				node.focus();
				node.setSelectionRange(result.caret, result.caret);
				setCaret(result.caret);
			});
		},
		[value, caret, onChange],
	);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (!isOpen) return false;

			if (event.key === "ArrowDown") {
				event.preventDefault();
				setActiveIndex((i) => (i + 1) % suggestions.length);
				return true;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				setActiveIndex(
					(i) => (i - 1 + suggestions.length) % suggestions.length,
				);
				return true;
			}
			// generic accept keys - maps both Enter and Tab to selection acceptance.
			if (event.key === "Enter" || event.key === "Tab") {
				event.preventDefault();
				const member = suggestions[activeIndex];
				if (member) select(member);
				return true;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				setCaret(-1);
				return true;
			}
			return false;
		},
		[isOpen, suggestions, activeIndex, select],
	);

	const syncCaret = useCallback((node: HTMLTextAreaElement) => {
		setCaret(node.selectionStart ?? 0);
	}, []);

	useEffect(() => {
		setActiveIndex(0);
	}, []);

	useEffect(() => {
		if (!projectId) return;
		let cancelled = false;

		getProjectMembersAction(projectId).then((result) => {
			if (!cancelled && result.success && result.data) setMembers(result.data);
		});

		return () => {
			cancelled = true;
		};
	}, [projectId]);

	return {
		inputRef,
		allMembers: members,
		suggestions,
		isOpen,
		activeIndex,
		setActiveIndex,
		select,
		handleKeyDown,
		syncCaret,
	};
}
