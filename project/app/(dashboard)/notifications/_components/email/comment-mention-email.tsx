import {
	Button,
	Heading,
	Section,
	Text,
} from "@react-email/components";
import { EmailLayout } from "./layout";

interface CommentMentionEmailProps {
	mentionedBy: string;
	taskName: string;
	commentBody: string;
	taskUrl: string;
}

export function CommentMentionEmail({
	mentionedBy,
	taskName,
	commentBody,
	taskUrl,
}: CommentMentionEmailProps) {
	const previewText = `${mentionedBy} mentioned you on a task`;

	return (
		<EmailLayout previewText={previewText}>
			<Heading className="text-2xl font-bold text-slate-900 mx-0 my-7.5 p-0 text-center">
				You were mentioned
			</Heading>
			<Text className="text-base leading-[24px] text-slate-700">
				Hello,
			</Text>
			<Text className="text-base leading-[24px] text-slate-700">
				<strong>{mentionedBy}</strong> mentioned you in a comment on the task{" "}
				<strong>{taskName}</strong>:
			</Text>

			<Section className="bg-slate-50 border border-solid border-slate-200 rounded p-4 my-6">
				<Text className="text-base italic text-slate-600 m-0">
					"{commentBody}"
				</Text>
			</Section>

			<Section className="text-center mt-[32px] mb-[32px]">
				<Button
					className="bg-primary rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
					href={taskUrl}
				>
					View Comment
				</Button>
			</Section>
		</EmailLayout>
	);
}
