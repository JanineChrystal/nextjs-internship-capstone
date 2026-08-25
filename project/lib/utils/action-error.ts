const GENERIC_ERROR = "An unexpected error occurred";

/**
 * Turns a thrown error into something safe to show a user.
 *
 * The list of allowed messages is passed in rather than hardcoded, because each
 * action module has its own narrow set. This function was written out twice -
 * once in group-actions and once in workspace-member-actions - with only the
 * list and one special case differing, which is exactly the shape that belongs
 * in one place with the varying parts as arguments.
 *
 * `overrides` handles the case where a message means something different in this
 * context: "Unauthorized" is accurate but useless to a user, and the group
 * actions want to say which permission is missing.
 */
export function toUserFacingError(
	error: unknown,
	allowedMessages: readonly string[],
	overrides: Record<string, string> = {},
): string {
	if (!(error instanceof Error)) return GENERIC_ERROR;

	const override = overrides[error.message];
	if (override) return override;

	return allowedMessages.includes(error.message)
		? error.message
		: GENERIC_ERROR;
}
