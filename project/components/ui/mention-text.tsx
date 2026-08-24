import { type MentionToken, tokenizeMentions } from "@/lib/utils/mentions";

/**
 * mention text - parses and highlights @-mentions within plain text. Renders
 * safely via React nodes to prevent injection, and styles mentions as static
 * spans instead of links since leaving a comment thread mid-read is disruptive.
 */
export function MentionText({
	body,
	members,
}: {
	body: string;
	/** mention map - a dictionary of user handles to profiles; unmapped handles remain unstyled text. */
	members: Map<string, { userId: string; label: string }>;
}) {
	const tokens = tokenizeMentions(body, (handle) => members.get(handle));

	return (
		<span className="whitespace-pre-wrap wrap-break-word">
			{tokens.map((token, index) => renderToken(token, index))}
		</span>
	);
}

function renderToken(token: MentionToken, index: number) {
	/** stable keys - array index is safe here because tokens are immutably derived from a single string with no internal reordering. */
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
