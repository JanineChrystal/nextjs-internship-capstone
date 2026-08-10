import { UserPlus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { ROLE_OPTIONS } from "@/app/(dashboard)/_constants/add-member-modal";
import type { AddInviteFormValues } from "@/app/(dashboard)/_hooks/use-add-member-modal";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";

interface AddMemberFormProps {
	form: UseFormReturn<AddInviteFormValues>;
	onSubmit: (values: AddInviteFormValues) => void;
}

export function AddMemberForm({ form, onSubmit }: AddMemberFormProps) {
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
		watch,
	} = form;

	const recipient = watch("recipient");
	const jobRole = watch("jobRole");

	const isSubmitDisabled =
		!recipient?.trim() || !jobRole?.trim() || isSubmitting;

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full"
		>
			<div className="flex-1 w-full">
				<label htmlFor="recipient" className="sr-only">
					Recipient Email or Username
				</label>
				<Input
					id="recipient"
					placeholder="Type email / user..."
					{...register("recipient")}
					className="bg-surface border-outline-variant text-on-surface focus-visible:ring-primary h-10 w-full"
				/>
			</div>

			<div className="flex-1 w-full">
				<label htmlFor="jobRole" className="sr-only">
					Job Role
				</label>
				<Input
					id="jobRole"
					placeholder="Position (Job Role)"
					{...register("jobRole")}
					className="bg-surface border-outline-variant text-on-surface focus-visible:ring-primary h-10 w-full"
				/>
			</div>

			<div className="w-full sm:w-32 shrink-0">
				<label htmlFor="roleAccess" className="sr-only">
					Role Access
				</label>
				<select
					id="roleAccess"
					{...register("roleAccess")}
					className="h-10 px-3 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
				>
					{ROLE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<Button
				type="submit"
				disabled={isSubmitDisabled}
				className="h-10 w-full sm:w-auto shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
			>
				<UserPlus size={16} className="mr-2" />
				Add
			</Button>
		</form>
	);
}
