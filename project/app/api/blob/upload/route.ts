import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal/auth";

/** attachment limits - a task attachment is a document or a screenshot, not a video. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"application/pdf",
	"text/plain",
	"text/csv",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/zip",
];

export async function POST(request: Request): Promise<NextResponse> {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const result = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async () => {
				const user = await getCurrentUser();
				if (!user) throw new Error("Unauthorized");

				return {
					allowedContentTypes: ALLOWED_TYPES,
					maximumSizeInBytes: MAX_UPLOAD_BYTES,
					addRandomSuffix: true,
					/** the uploader, carried through - the completion callback has no session of its own. */
					tokenPayload: JSON.stringify({ userId: user.id }),
				};
			},
			/** nothing to do on completion - the attachment row is written by the action the client calls next, which is also where the permission check lives. */
			onUploadCompleted: async () => {},
		});

		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Upload could not be authorised";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
