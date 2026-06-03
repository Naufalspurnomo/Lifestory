import { NextResponse } from "next/server";

export const jsonBodyLimits = {
  tiny: 4 * 1024,
  auth: 8 * 1024,
  treeMutation: 8 * 1024 * 1024,
} as const;

export class RequestBodyTooLargeError extends Error {
  constructor(public readonly limitBytes: number) {
    super("Request body too large");
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Invalid request body");
  }
}

export type JsonBodyResult =
  | { success: true; body: unknown }
  | { success: false; response: NextResponse };

function parseContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function readRequestTextWithLimit(
  request: Request,
  limitBytes: number
): Promise<string> {
  const contentLength = parseContentLength(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > limitBytes) {
    throw new RequestBodyTooLargeError(limitBytes);
  }

  if (!request.body) {
    throw new InvalidJsonBodyError();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      receivedBytes += value.byteLength;
      if (receivedBytes > limitBytes) {
        await reader.cancel().catch(() => undefined);
        throw new RequestBodyTooLargeError(limitBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

export async function readJsonBody(
  request: Request,
  limitBytes: number
): Promise<unknown> {
  const text = await readRequestTextWithLimit(request, limitBytes);
  if (!text.trim()) {
    throw new InvalidJsonBodyError();
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidJsonBodyError();
  }
}

export async function parseJsonBody(
  request: Request,
  limitBytes: number
): Promise<JsonBodyResult> {
  try {
    return { success: true, body: await readJsonBody(request, limitBytes) };
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Request body too large",
            maxBytes: error.limitBytes,
          },
          { status: 413 }
        ),
      };
    }

    if (error instanceof InvalidJsonBodyError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        ),
      };
    }

    throw error;
  }
}
