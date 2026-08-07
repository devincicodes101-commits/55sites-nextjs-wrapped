import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Issues short-lived tokens so the browser can upload a survey PDF/image DIRECTLY
 * to Vercel Blob storage, bypassing Vercel's ~4.5MB serverless request-body limit.
 * The file never passes through our function — only its resulting URL is sent on
 * to /api/survey-quote afterwards.
 *
 * Requires BLOB_READ_WRITE_TOKEN (added automatically when the Blob store is
 * connected to the project in Vercel).
 */
export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// The read-write token for the PUBLIC survey-uploads Blob store. Read from the
// env var (never hard-coded). Accepts a few likely names so it works regardless
// of exactly how it was added in Vercel.
function blobToken(): string | undefined {
  return (
    process.env.SURVEY_READ_WRITE_TOKEN ||
    process.env.Survey_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken(),
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: 50 * 1024 * 1024, // 50MB — big multi-page surveys
      }),
      onUploadCompleted: async () => {
        // No-op: the survey-quote request reads the returned blob URL directly.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
