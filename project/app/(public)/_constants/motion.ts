import type { Transition, Variants } from "motion/react";

/**
 * One motion vocabulary for the whole landing page.
 *
 * Every section uses these rather than declaring its own durations and offsets.
 * That is not only DRY - it is what makes the page feel like one document. A
 * page where each section invented its own timing reads as several pages stuck
 * together, and it is the single most common way scroll animation goes wrong.
 *
 * The numbers themselves are chosen to be noticed only in aggregate: 24px of
 * travel and 500ms is enough to give the eye a direction to follow and short
 * enough that a reader scrolling quickly never waits for content.
 */

const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];

export const REVEAL_TRANSITION: Transition = {
	duration: 0.5,
	ease: EASE_OUT,
};

/** A single element rising into place. */
export const fadeUp: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};

/**
 * A container whose children arrive one after another.
 *
 * `staggerChildren` is small on purpose. A long stagger looks impressive on a
 * three-item row and becomes unbearable on an eight-item grid, where the last
 * item would still be arriving after the reader has moved on.
 */
export const staggerContainer: Variants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.06, delayChildren: 0.04 },
	},
};

/**
 * When to trigger. `amount: 0.2` fires once a fifth of the element is on
 * screen - late enough that it is not animating off-viewport, early enough that
 * it is never caught mid-animation by a reader who scrolled straight to it.
 *
 * `once` is true everywhere: an element that re-animates each time it scrolls
 * back into view turns a second read-through into a slideshow.
 */
export const VIEWPORT = { once: true, amount: 0.2 } as const;
