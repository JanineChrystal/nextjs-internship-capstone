import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface ProjectCompletedEmailProps {
	completedBy: string;
	projectName: string;
	projectUrl: string;
}

/**
 * Sent to a project's members when it is marked complete.
 *
 * Wider reach than the task email by design: a task closing concerns the people
 * working on it, while a project closing concerns everyone on it - it is the
 * moment their involvement ends.
 */
export function ProjectCompletedEmail({
	completedBy,
	projectName,
	projectUrl,
}: ProjectCompletedEmailProps) {
	const previewText = `${projectName} was marked complete`;

	return (
		<EmailLayout previewText={previewText}>
			<Heading className="text-2xl font-bold text-slate-900 mx-0 my-7.5 p-0 text-center">
				Project completed
			</Heading>
			<Text className="text-base leading-[24px] text-slate-700">Hello,</Text>
			<Text className="text-base leading-[24px] text-slate-700">
				<strong>{completedBy}</strong> marked a project you are part of as
				complete.
			</Text>

			<Section className="bg-slate-50 border border-solid border-slate-200 rounded p-4 my-6">
				<Text className="text-base font-semibold text-slate-900 m-0">
					{projectName}
				</Text>
			</Section>

			<Text className="text-base leading-[24px] text-slate-700">
				It stays available to open and read - completing a project does not
				archive it.
			</Text>

			<Section className="text-center mt-[32px] mb-[32px]">
				<Button
					className="bg-primary rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
					href={projectUrl}
				>
					View Project
				</Button>
			</Section>
		</EmailLayout>
	);
}
