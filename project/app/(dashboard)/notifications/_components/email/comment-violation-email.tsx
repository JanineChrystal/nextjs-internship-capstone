import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface CommentViolationEmailProps {
	taskName: string;
	commentBody: string;
	reason: string;
	taskUrl: string;
}

/**
 * Sent to the author of a comment the language filter flagged after the fact.
 *
 * Only the *late* verdicts reach this email. When both detectors answer before
 * the comment is stored, the composer tells the author in a dialog and nothing
 * is sent - an email restating what a person read two seconds ago is noise.
 * This covers the case that dialog cannot: a detector that timed out, and a
 * recheck that found something minutes or hours later, by which time the author
 * has long since closed the tab.
 *
 * The comment is quoted back deliberately. A flagged comment is withheld from
 * the thread, so without the text the author has no way to know which of their
 * comments this is about - and it is their own writing, not something the quote
 * exposes to anyone new.
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
