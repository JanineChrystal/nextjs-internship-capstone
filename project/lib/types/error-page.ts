/**
 * The HTTP conditions the shared error screen knows how to draw.
 *
 * Deliberately a closed union rather than `number`. Every code here has a
 * hand-written diagnosis and a set of recovery routes that make sense for it, so
 * accepting an arbitrary status would mean accepting one the screen cannot
 * actually explain.
 */
export type ErrorPageCode = "401" | "403" | "404" | "500";

/**
 * How loudly a code is drawn.
 *
 * This is a presentation decision, not a synonym for the code: 404 and 403 are
 * both refusals, but a missing page is a dead end the reader can walk back from,
 * while a forbidden one is a denial they need to notice.
 *
 * - `neutral` - nothing is broken; the address is simply wrong.
 * - `action`  - the reader can resolve this themselves, usually by signing in.
 * - `fault`   - something failed, or access was refused outright.
 */
export type ErrorSeverity = "neutral" | "action" | "fault";

/**
 * One line in the recovery-routes block.
 *
 * `hint` is not decoration. A bare list of paths tells someone who has just hit
 * a wall nothing about which one leads back to where they were, and the whole
 * point of printing routes rather than a single "Go home" button is to let them
 * choose.
 */
export interface RecoveryRoute {
	/** Where the line navigates. Internal paths only - these render as `Link`s. */
	href: string;
	/** The path as printed, e.g. `/projects`. */
	label: string;
	/** What the reader gets by taking it. */
	hint: string;
}
