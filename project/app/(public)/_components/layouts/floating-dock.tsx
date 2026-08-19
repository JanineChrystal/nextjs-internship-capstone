"use client";

import { MessageCircle, Palette } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/buttons/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { AppearanceDrawer } from "../appearance/appearance-drawer";
import { ContactDrawer } from "../contact/contact-drawer";

/**
 * The two floating buttons in the bottom-right corner, plus the drawers they
 * open.
 *
 * The dock and the drawers are mounted together rather than the drawers living
 * in the layout, because they are one feature: nothing else on the page needs to
 * know either exists. Other openers - the pricing card's "Contact us", the
 * footer link - reach the same drawers through the store rather than through a
 * prop, which is why this component takes none.
 *
 * ## Positioning, and why it is not simply `bottom-6 right-6`
 *
 * `bottom-[max(1.5rem,env(safe-area-inset-bottom))]` keeps the dock clear of the
 * home indicator on an iPhone and the gesture bar on Android. Without it the
 * lower button sits underneath the system UI on exactly the devices where a
 * floating action button is most useful.
 *
 * Each button is 44px square at its smallest, which is the minimum comfortable
 * touch target - a 32px icon button is fine for a mouse and genuinely hard to
 * hit with a thumb.
 */
export function FloatingDock() {
	const openContact = useLandingUiStore((state) => state.openContact);
	const openAppearance = useLandingUiStore((state) => state.openAppearance);
	const shouldReduceMotion = useReducedMotion();

	const actions = [
		{
			label: "Appearance & themes",
			icon: Palette,
			onClick: openAppearance,
			variant: "outline" as const,
		},
		{
			label: "Contact us",
			icon: MessageCircle,
			onClick: openContact,
			variant: "default" as const,
		},
	];

	return (
		<TooltipProvider delayDuration={200}>
			<motion.div
				className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col gap-2 sm:right-6 sm:bottom-6"
				initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				// A deliberate delay so the dock arrives after the hero has settled
				// rather than competing with it for attention on first paint.
				transition={{ delay: 0.6, duration: 0.4 }}
			>
				{actions.map((action) => (
					<Tooltip key={action.label}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant={action.variant}
								onClick={action.onClick}
								aria-label={action.label}
								className="size-11 rounded-full p-0 shadow-lg"
							>
								<action.icon className="size-5" aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left">{action.label}</TooltipContent>
					</Tooltip>
				))}
			</motion.div>

			<AppearanceDrawer />
			<ContactDrawer />
		</TooltipProvider>
	);
}
