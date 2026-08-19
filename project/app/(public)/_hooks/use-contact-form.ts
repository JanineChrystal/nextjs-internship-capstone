"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { submitContactMessageAction } from "@/lib/actions/contact-actions";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import {
	type ContactMessageFormValues,
	ContactMessageSchema,
} from "@/lib/validations/contact-schema";

/**
 * The contact drawer's state, kept out of the component.
 *
 * The form component's job is layout; deciding what happens on submit is not
 * layout. Splitting them is also what makes the "sent" state easy to reason
 * about - there is exactly one place that can set it.
 *
 * ## Why this one does not update optimistically
 *
 * Every other mutation in this app writes to a store immediately and rolls back
 * if the server disagrees, because the user is looking at data that should
 * change instantly. Here there is nothing on screen to update: the only thing
 * the user wants to know is whether the message actually arrived, and claiming
 * it did before the server said so is precisely the wrong lie to tell. So this
 * one waits.
 */
export function useContactForm() {
	// Local state
	const [isSent, setIsSent] = useState(false);

	const form = useForm<ContactMessageFormValues>({
		resolver: zodResolver(ContactMessageSchema),
		defaultValues: {
			name: "",
			email: "",
			organization: "",
			topic: "general",
			message: "",
			// The honeypot starts empty and no control ever writes to it. Registering
			// it here rather than leaving it out of the form entirely is what makes
			// the field part of the submitted payload, which is the whole point.
			website: "",
		},
	});

	// Handlers
	const onSubmit = form.handleSubmit(async (values) => {
		const result = await submitContactMessageAction(values);

		if (!result.success) {
			reportActionError(result.error ?? "Could not send your message");
			return;
		}

		reportActionSuccess("Message sent");
		form.reset();
		setIsSent(true);
	});

	const reset = () => {
		form.reset();
		setIsSent(false);
	};

	return {
		form,
		isSent,
		isSubmitting: form.formState.isSubmitting,
		onSubmit,
		reset,
	};
}
