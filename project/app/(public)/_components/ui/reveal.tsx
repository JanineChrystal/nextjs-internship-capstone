"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer, VIEWPORT } from "../../_constants/motion";

interface RevealProps {
	children: ReactNode;
	className?: string;
	/**
	 * Animate the children in sequence rather than the wrapper as one block.
	 * Each direct child must itself be a `<RevealItem>` for this to do anything.
	 */
	stagger?: boolean;
	/** Seconds to wait before starting. Used to offset a heading from its body. */
	delay?: number;
	as?: "div" | "section" | "ul";
}

/**
 * The one scroll-reveal wrapper the whole landing page uses.
 *
 * Written once and reused rather than each section calling `motion.div` with its
 * own props - eleven sections each choosing their own offsets is how a page ends
 * up feeling inconsistent, and it is eleven places to fix when the timing is
 * wrong.
 *
 * ## Why it respects prefers-reduced-motion
 *
 * `useReducedMotion()` reads the operating system setting that some people set
 * because scroll animation makes them physically unwell - vestibular disorders
 * make large moving elements genuinely nauseating. When it is on, this returns
 * the children with no animation at all rather than a faster one: the content
 * still appears, it simply appears immediately. That is a real accessibility
 * requirement, not a nicety, and doing it in this one component is why no
 * section has to remember it.
 */
export function Reveal({
	children,
	className,
	stagger,
	delay = 0,
	as = "div",
}: RevealProps) {
	const shouldReduceMotion = useReducedMotion();
	const Component = motion[as];

	if (shouldReduceMotion) {
		const Plain = as;
		return <Plain className={className}>{children}</Plain>;
	}

	return (
		<Component
			className={cn(className)}
			initial="hidden"
			whileInView="visible"
			viewport={VIEWPORT}
			variants={stagger ? staggerContainer : fadeUp}
			transition={delay ? { delay } : undefined}
		>
			{children}
		</Component>
	);
}

/**
 * One child inside a staggered `<Reveal stagger>`.
 *
 * Split from Reveal because the two do different jobs: Reveal decides *when* a
 * group starts, this decides *how* one member of it arrives. Collapsing them
 * into one component with a boolean would mean every caller passing the flag
 * that says which of the two behaviours it wanted.
 */
export function RevealItem({
	children,
	className,
	as = "div",
}: {
	children: ReactNode;
	className?: string;
	as?: "div" | "li" | "article";
}) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		const Plain = as;
		return <Plain className={className}>{children}</Plain>;
	}

	const Component = motion[as];
	return (
		<Component className={className} variants={fadeUp}>
			{children}
		</Component>
	);
}
