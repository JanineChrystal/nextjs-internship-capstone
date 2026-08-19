import {
	Button,
	Heading,
	Section,
	Text,
} from "@react-email/components";
import { EmailLayout } from "./layout";

interface ProjectInviteEmailProps {
	invitedBy: string;
	projectName: string;
	workspaceName: string;
	inviteUrl: string;
}

export function ProjectInviteEmail({
	invitedBy,
	projectName,
	workspaceName,
	inviteUrl,
}: ProjectInviteEmailProps) {
	const previewText = `You've been invited to ${projectName}`;

	return (
		<EmailLayout previewText={previewText}>
			<Heading className="text-2xl font-bold text-slate-900 mx-0 my-7.5 p-0 text-center">
				Join {projectName}
			</Heading>
			<Text className="text-base leading-[24px] text-slate-700">
				Hello,
			</Text>
			<Text className="text-base leading-[24px] text-slate-700">
				<strong>{invitedBy}</strong> has invited you to collaborate on the{" "}
				<strong>{projectName}</strong> project in the{" "}
				<strong>{workspaceName}</strong> workspace.
			</Text>

			<Section className="text-center mt-[32px] mb-[32px]">
				<Button
					className="bg-primary rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
					href={inviteUrl}
				>
					Accept Invitation
				</Button>
			</Section>

			<Text className="text-base leading-[24px] text-slate-700">
				Or, copy and paste this link into your browser:
				<br />
				<a href={inviteUrl} className="text-primary no-underline">
					{inviteUrl}
				</a>
			</Text>
		</EmailLayout>
	);
}
