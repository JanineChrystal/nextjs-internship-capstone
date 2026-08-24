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
 * reveal component - a centralized scroll-reveal wrapper using framer-motion
 * that globally respects the prefers-reduced-motion accessibility setting
 * without requiring section-level logic.
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
 * reveal item - handles individual child animations within a staggered
 * Reveal parent, separated to avoid overloaded component boolean props.
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
