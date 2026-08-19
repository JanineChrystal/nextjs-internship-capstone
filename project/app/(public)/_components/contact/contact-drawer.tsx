"use client";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { CONTACT_COPY } from "../../_constants/contact";
import { ContactForm } from "./contact-form";

/**
 * The contact drawer, entering from the bottom.
 *
 * ## Why the app's Sheet rather than shadcn's `drawer`
 *
 * shadcn ships two overlays that both get called a drawer. `drawer` is built on
 * `vaul` and adds drag-to-dismiss physics; `sheet` is built directly on Radix's
 * Dialog and already takes a `side` of top, right, bottom or left. This project
 * already vendors the Radix one, uses it for the mobile menu and elsewhere in
 * the app, and it is what "the Radix UI one" means.
 *
 * Choosing it over adding `vaul` buys: one overlay implementation on the page
 * instead of two that must be kept looking alike, no new dependency, and the
 * focus-trap and scroll-lock behaviour the rest of the app already relies on.
 * What it costs is the drag-down-to-close gesture, which a bottom sheet on a
 * phone arguably wants. If that gesture turns out to matter, swapping this one
 * component to `vaul` touches this file and nothing else - the form inside knows
 * nothing about which shell it is in.
 *
 * Bottom rather than right because the form is wide and short: two fields side
 * by side read comfortably across the full width of a phone, whereas a
 * right-hand panel would force every field into a narrow column.
 */
export function ContactDrawer() {
	const isOpen = useLandingUiStore((state) => state.isContactOpen);
	const setOpen = useLandingUiStore((state) => state.setContactOpen);

	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			<SheetContent
				side="bottom"
				// max-h with overflow so a phone in landscape - where the viewport is
				// barely taller than the form - can still scroll to the submit button
				// rather than having it sit below the fold with no way to reach it.
				className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t"
			>
				<div className="mx-auto w-full max-w-2xl pb-6">
					<SheetHeader className="px-0 pt-2">
						<SheetTitle className="text-xl">{CONTACT_COPY.title}</SheetTitle>
						<SheetDescription>{CONTACT_COPY.description}</SheetDescription>
					</SheetHeader>

					<div className="mt-4">
						<ContactForm onSent={() => setOpen(false)} />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
