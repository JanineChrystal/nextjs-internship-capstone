import { toast } from "sonner";

/**
 * Client-side reporting for a failed server action.
 *
 * Every mutation in this app updates the store optimistically and rolls back on
 * failure. Rolling back silently is indistinguishable from "the app ignored me",
 * and it hid a real permission bug during testing - so the rollback and this
 * call belong together at every call site.
 *
 * The console line is kept as well: the toast is for the user, the console entry
 * carries the original error and its `cause` chain for debugging.
 */
export function reportActionError(context: string, error?: unknown): void {
	console.error(`${context}:`, error);
	toast.error(context, { description: toReason(error) });
}

export function reportActionSuccess(message: string): void {
	toast.success(message);
}

/**
 * The server actions in this codebase reject in two shapes - a returned
 * `{ success: false, error }` string and a thrown Error - so both are unwrapped
 * here rather than at each of the ~36 call sites.
 */
function toReason(error: unknown): string | undefined {
	if (typeof error === "string") return error || undefined;
	if (error instanceof Error) return error.message || undefined;
	return undefined;
}
