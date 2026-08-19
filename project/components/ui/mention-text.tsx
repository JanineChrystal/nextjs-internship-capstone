import { type MentionToken, tokenizeMentions } from "@/lib/utils/mentions";

/**
 * A comment body with its @-mentions highlighted.
 *
 * Renders React nodes, never an HTML string, so React escapes every text node
 * itself and a comment can never become markup. This is why the codebase bans
 * `dangerouslySetInnerHTML` - the safe version is barely more code.
 *
 * The mention is a `<span>`, not a link. It resolves to a person, but there is
 * nowhere useful to send you: the profile page shows a workspace member, not a
 * project one, and a link that navigates away mid-thread is rarely what someone
 * clicking a name in a comment wants.
 */
export function MentionText({
	body,
	members,
}: {
	body: string;
	/** handle -> member. Missing handles stay as plain text. */
	members: Map<string, { userId: string; label: string }>;
}) {
	const tokens = tokenizeMentions(body, (handle) => members.get(handle));

	return (
		<span className="whitespace-pre-wrap break-words">
			{tokens.map((token, index) => renderToken(token, index))}
		</span>
	);
}

function renderToken(token: MentionToken, index: number) {
	// The index is safe as a key here: the token list is derived from one
	// immutable string and is regenerated whole whenever that string changes, so
	// there is no reordering for a positional key to get wrong.
	const key = `${token.type}-${index}`;

	if (token.type === "mention") {
		return (
			<span
				key={key}
				className="rounded bg-primary/10 px-1 font-medium text-primary"
			>
				@{token.label}
			</span>
		);
	}

	return <span key={key}>{token.value}</span>;
}
