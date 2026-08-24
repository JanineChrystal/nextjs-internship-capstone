import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface CommentViolationEmailProps {
	taskName: string;
	commentBody: string;
	reason: string;
	taskUrl: string;
}

/**
 * comment violation email - sent to users when a comment is flagged by
 * late-stage language filters, quoting the withheld text to provide clear
 * context on what triggered the review.
 */
export function CommentViolationEmail({
	taskName,
	commentBody,
	reason,
	taskUrl,
}: CommentViolationEmailProps) {
	const previewText = "A comment of yours is under review";

	return (
		<EmailLayout previewText={previewText}>
			<Heading className="text-2xl font-bold text-slate-900 mx-0 my-7.5 p-0 text-center">
				Your comment is under review
			</Heading>
			<Text className="text-base leading-[24px] text-slate-700">Hello,</Text>
			<Text className="text-base leading-[24px] text-slate-700">
				A comment you posted on the task <strong>{taskName}</strong> was
				detected to have a profanity word/s, so it is now waiting for a project
				owner to review it. It stays hidden from the thread until they do.
			</Text>

			<Section className="bg-slate-50 border border-solid border-slate-200 rounded p-4 my-6">
				<Text className="text-base italic text-slate-600 m-0">
					"{commentBody}"
				</Text>
				<Text className="text-sm text-slate-500 mt-3 mb-0">
					Detected as: {reason}
				</Text>
			</Section>

			<Text className="text-base leading-[24px] text-slate-700">
				If this was a mistake, the owner can clear the flag and your comment
				will appear as normal.
			</Text>

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
