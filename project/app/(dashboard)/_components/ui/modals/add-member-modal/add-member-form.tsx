import { UserPlus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { ROLE_OPTIONS } from "@/app/(dashboard)/_constants/add-member-modal";
import type { AddInviteFormValues } from "@/app/(dashboard)/_hooks/use-add-member-modal";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";

interface AddMemberFormProps {
	form: UseFormReturn<AddInviteFormValues>;
	onSubmit: (values: AddInviteFormValues) => void;
	scope: "project" | "workspace";
}

export function AddMemberForm({ form, onSubmit, scope }: AddMemberFormProps) {
	const {
		register,
		handleSubmit,
		formState: { isSubmitting, errors },
		watch,
	} = form;

	const recipient = watch("recipient");
	const jobRole = watch("jobRole");

	const isSubmitDisabled =
		scope === "project"
			? !recipient?.trim() || !jobRole?.trim() || isSubmitting
			: !recipient?.trim() || isSubmitting;

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col sm:flex-row gap-3 items-start sm:items-start w-full"
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
				{/* Rendered because a rejected submit used to be completely silent -
				    the button simply appeared not to work. */}
				{errors.recipient && (
					<p className="mt-1 text-xs text-error">{errors.recipient.message}</p>
				)}
			</div>

			{scope === "project" && (
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
					{errors.jobRole && (
						<p className="mt-1 text-xs text-error">{errors.jobRole.message}</p>
					)}
				</div>
			)}

			{scope === "project" && (
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
			)}

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
