import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface TaskCompletedEmailProps {
	completedBy: string;
	taskName: string;
	projectName: string;
	taskUrl: string;
}

/**
 * Sent to a task's assignees when someone marks it complete.
 *
 * Only the *other* assignees hear about it - `recordActivity` drops the actor,
 * so the person who ticked the box is never emailed about their own click.
 *
 * The project name is included because an assignee may be on several projects
 * and a task called "Fix login" is ambiguous without it.
 */
export function TaskCompletedEmail({
	completedBy,
	taskName,
	projectName,
	taskUrl,
}: TaskCompletedEmailProps) {
	const previewText = `${completedBy} completed ${taskName}`;

	return (
		<EmailLayout previewText={previewText}>
			<Heading className="text-2xl font-bold text-slate-900 mx-0 my-7.5 p-0 text-center">
				Task completed
			</Heading>
			<Text className="text-base leading-[24px] text-slate-700">Hello,</Text>
			<Text className="text-base leading-[24px] text-slate-700">
				<strong>{completedBy}</strong> marked a task you are assigned to as
				complete.
			</Text>

			<Section className="bg-slate-50 border border-solid border-slate-200 rounded p-4 my-6">
				<Text className="text-base font-semibold text-slate-900 m-0">
					{taskName}
				</Text>
				<Text className="text-sm text-slate-500 mt-1 mb-0">{projectName}</Text>
			</Section>

			<Section className="text-center mt-[32px] mb-[32px]">
				<Button
					className="bg-primary rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
					href={taskUrl}
				>
					View Task
				</Button>
			</Section>
		</EmailLayout>
	);
}
