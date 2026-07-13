import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

const WELCOME_KIND = "welcome_registration";
const MAX_ATTEMPTS = 5;
const STALE_PROCESSING_MS = 10 * 60 * 1000;
const DISABLED_RETRY_MS = 60 * 60 * 1000;

type WuzapiConfig = {
  baseUrl: string;
  token: string;
  imageUrl: string;
  timeoutMs: number;
};

type SendResult =
  | { kind: "sent" }
  | { kind: "retry"; error: string }
  | { kind: "review"; error: string }
  | { kind: "disabled" };

export function normalizeWhatsAppPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return normalized.length >= 10 && normalized.length <= 15 ? normalized : null;
}

export function buildWelcomePayload({
  name,
  phone,
  origin,
  imageUrl,
}: {
  name: string;
  phone: string;
  origin: string;
  imageUrl: string;
}) {
  return {
    Phone: phone,
    Body: `Halo ${name}, selamat datang di Lifestory.\n\nSilakan verifikasi email Anda terlebih dahulu. Setelah itu, mulai susun kisah keluarga Anda di Lifestory.`,
    Footer: "Lifestory",
    Image: imageUrl,
    Buttons: [
      {
        type: "cta_url",
        title: "Buka Lifestory",
        url: new URL("/app", origin).toString(),
      },
    ],
  };
}

function readConfig(env = process.env): WuzapiConfig | null {
  const baseUrl = env.WUZAPI_BASE_URL?.trim().replace(/\/+$/, "");
  const token = env.WUZAPI_TOKEN?.trim();
  const imageUrl = env.WUZAPI_WELCOME_IMAGE_URL?.trim();
  if (!baseUrl || !token || !imageUrl) return null;

  const rawTimeout = Number(env.WUZAPI_TIMEOUT_MS || 8000);
  return {
    baseUrl,
    token,
    imageUrl,
    timeoutMs: Number.isFinite(rawTimeout)
      ? Math.min(Math.max(rawTimeout, 1000), 30_000)
      : 8000,
  };
}

async function sendWelcome({
  name,
  recipient,
  origin,
  env = process.env,
}: {
  name: string;
  recipient: string;
  origin: string;
  env?: NodeJS.ProcessEnv;
}): Promise<SendResult> {
  const config = readConfig(env);
  if (!config) return { kind: "disabled" };

  const phone = normalizeWhatsAppPhone(recipient);
  if (!phone) return { kind: "review", error: "invalid_recipient" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl}/chat/send/buttons`, {
      method: "POST",
      headers: { token: config.token, "Content-Type": "application/json" },
      body: JSON.stringify(
        buildWelcomePayload({ name, phone, origin, imageUrl: config.imageUrl })
      ),
      signal: controller.signal,
    });

    if (response.ok) return { kind: "sent" };
    if (response.status === 408 || response.status === 429 || response.status >= 500) {
      return { kind: "retry", error: `http_${response.status}` };
    }
    return { kind: "review", error: `http_${response.status}` };
  } catch {
    // The request may have reached WuzAPI even if fetch cannot confirm it.
    return { kind: "review", error: "ambiguous_transport_failure" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function enqueueRegistrationWelcome(
  tx: Prisma.TransactionClient,
  input: { userId: string; phone: string }
) {
  return tx.whatsAppOutbox.create({
    data: {
      userId: input.userId,
      kind: WELCOME_KIND,
      recipient: normalizeWhatsAppPhone(input.phone) || input.phone.trim(),
    },
    select: { id: true },
  });
}

function nextAttemptAt(attempt: number, now: Date): Date {
  const delayMs = Math.min(60 * 60 * 1000, 5 * 60 * 1000 * 2 ** (attempt - 1));
  return new Date(now.getTime() + delayMs);
}

export async function processWhatsAppWelcomeJob(
  id: string,
  origin: string,
  env: NodeJS.ProcessEnv = process.env
): Promise<SendResult | null> {
  const now = new Date();
  const claimed = await prisma.whatsAppOutbox.updateMany({
    where: { id, status: "pending", nextAttemptAt: { lte: now } },
    data: { status: "processing", processingAt: now, attemptCount: { increment: 1 } },
  });
  if (claimed.count === 0) return null;

  const job = await prisma.whatsAppOutbox.findUniqueOrThrow({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  const result = await sendWelcome({
    name: job.user.name,
    recipient: job.recipient,
    origin,
    env,
  });

  if (result.kind === "sent") {
    await prisma.whatsAppOutbox.update({
      where: { id },
      data: { status: "sent", sentAt: now, processingAt: null, lastError: null },
    });
  } else if (result.kind === "disabled") {
    await prisma.whatsAppOutbox.update({
      where: { id },
      data: {
        status: "pending",
        processingAt: null,
        attemptCount: { decrement: 1 },
        nextAttemptAt: new Date(now.getTime() + DISABLED_RETRY_MS),
        lastError: "wuzapi_not_configured",
      },
    });
  } else if (result.kind === "retry" && job.attemptCount < MAX_ATTEMPTS) {
    await prisma.whatsAppOutbox.update({
      where: { id },
      data: {
        status: "pending",
        processingAt: null,
        nextAttemptAt: nextAttemptAt(job.attemptCount, now),
        lastError: result.error,
      },
    });
  } else {
    await prisma.whatsAppOutbox.update({
      where: { id },
      data: { status: "needs_review", processingAt: null, lastError: result.error },
    });
  }

  return result;
}

export async function processDueWhatsAppWelcomeJobs(origin: string) {
  const now = new Date();
  await prisma.whatsAppOutbox.updateMany({
    where: {
      status: "processing",
      processingAt: { lt: new Date(now.getTime() - STALE_PROCESSING_MS) },
    },
    data: { status: "pending", processingAt: null, nextAttemptAt: now },
  });

  const jobs = await prisma.whatsAppOutbox.findMany({
    where: { kind: WELCOME_KIND, status: "pending", nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: "asc" },
    take: 25,
    select: { id: true },
  });

  let sent = 0;
  let retried = 0;
  let review = 0;
  for (const job of jobs) {
    const result = await processWhatsAppWelcomeJob(job.id, origin);
    if (result?.kind === "sent") sent += 1;
    else if (result?.kind === "retry" || result?.kind === "disabled") retried += 1;
    else if (result?.kind === "review") review += 1;
  }
  return { processed: jobs.length, sent, retried, review };
}
