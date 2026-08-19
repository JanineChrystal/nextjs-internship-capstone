"use client";

import { CheckCircle2, Send } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_COPY, CONTACT_TOPIC_OPTIONS } from "../../_constants/contact";
import { useContactForm } from "../../_hooks/use-contact-form";

/**
 * One field's error line.
 *
 * Extracted because five fields need the identical markup and the identical
 * `aria-describedby` wiring, and getting that wiring subtly different on one
 * field is exactly the kind of thing that is invisible until someone uses a
 * screen reader.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
	if (!message) return null;
	return (
		<p id={id} className="text-xs text-error">
			{message}
		</p>
	);
}

export function ContactForm({ onSent }: { onSent?: () => void }) {
	const { form, isSent, isSubmitting, onSubmit, reset } = useContactForm();
	const { register, control, formState } = form;
	const { errors } = formState;

	if (isSent) {
		return (
			<div className="flex flex-col items-center gap-4 py-10 text-center">
				<CheckCircle2
					className="h-10 w-10 text-chart-status-completed"
					aria-hidden="true"
				/>
				<div className="flex flex-col gap-1">
					<p className="text-base font-semibold text-on-surface">
						{CONTACT_COPY.sentTitle}
					</p>
					<p className="text-sm text-secondary">
						{CONTACT_COPY.sentDescription}
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button type="button" variant="outline" size="lg" onClick={reset}>
						Send another
					</Button>
					{onSent && (
						<Button type="button" size="lg" onClick={onSent}>
							Close
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
			{/*
			  THE HONEYPOT.

			  A real, empty text input that a person is never routed to and a bot
			  cannot tell apart from the fields around it. Four things together are
			  what make it invisible to people but visible to a script:

			    aria-hidden   - assistive technology skips it entirely
			    tabIndex={-1} - keyboard tabbing walks straight past it
			    autoComplete  - the browser will not helpfully fill it in
			    the wrapper   - moved off-screen, NOT display:none, because some
			                    bots specifically skip hidden inputs

			  The server rejects any submission that arrives with it filled, and
			  answers "sent" rather than "rejected" so the next attempt does not
			  simply leave it blank.
			*/}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
			>
				<label htmlFor="contact-website">Leave this field empty</label>
				<input
					id="contact-website"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					{...register("website")}
				/>
			</div>

			{/* Mobile-first: one column by default, two from the small breakpoint
			    up, because name and email are short enough to share a row as soon as
			    there is room for them. */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="contact-name">Name</Label>
					<Input
						id="contact-name"
						autoComplete="name"
						placeholder="Juan dela Cruz"
						aria-invalid={Boolean(errors.name)}
						aria-describedby={errors.name ? "contact-name-error" : undefined}
						{...register("name")}
					/>
					<FieldError id="contact-name-error" message={errors.name?.message} />
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="contact-email">Email</Label>
					<Input
						id="contact-email"
						type="email"
						inputMode="email"
						autoComplete="email"
						placeholder="you@company.com"
						aria-invalid={Boolean(errors.email)}
						aria-describedby={errors.email ? "contact-email-error" : undefined}
						{...register("email")}
					/>
					<FieldError
						id="contact-email-error"
						message={errors.email?.message}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="contact-organization">
						Organisation{" "}
						<span className="font-normal text-secondary">(optional)</span>
					</Label>
					<Input
						id="contact-organization"
						autoComplete="organization"
						placeholder="Where you work or study"
						{...register("organization")}
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="contact-topic">What is this about?</Label>
					{/*
					  Controller, not register. The select is a Radix component that
					  keeps its value in React state and calls onValueChange - it has
					  no native input for react-hook-form's ref to attach to, so it
					  has to be driven as a controlled field.
					*/}
					<Controller
						name="topic"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger id="contact-topic" className="w-full">
									<SelectValue placeholder="Choose one" />
								</SelectTrigger>
								<SelectContent>
									{CONTACT_TOPIC_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="contact-message">Message</Label>
				<Textarea
					id="contact-message"
					rows={5}
					placeholder="Tell us what you need. A sentence is fine."
					aria-invalid={Boolean(errors.message)}
					aria-describedby={
						errors.message ? "contact-message-error" : undefined
					}
					{...register("message")}
				/>
				<FieldError
					id="contact-message-error"
					message={errors.message?.message}
				/>
			</div>

			<div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-xs text-secondary">
					We only use your address to reply. No newsletter.
				</p>
				<Button
					type="submit"
					size="lg"
					disabled={isSubmitting}
					className="w-full sm:w-auto"
				>
					<Send aria-hidden="true" />
					{isSubmitting ? "Sending..." : "Send message"}
				</Button>
			</div>
		</form>
	);
}
