import "dotenv/config";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.AUTH_SMOKE_BASE_URL?.replace(/\/$/, "");

if (process.env.ALLOW_AUTH_SMOKE !== "1" || !baseUrl) {
  throw new Error(
    "Set ALLOW_AUTH_SMOKE=1 and AUTH_SMOKE_BASE_URL before running auth smoke."
  );
}

const prisma = new PrismaClient();
const email = `auth-smoke-${Date.now()}-${randomUUID()}@example.com`;
const password = "SmokePass123";
let smokeResult;

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`);
  }
}

function mergeResponseCookies(jar, response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);

  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0];
    const separator = pair.indexOf("=");
    if (separator > 0) {
      jar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

function serializeCookies(jar) {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function login() {
  const jar = new Map();
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  assertStatus(csrfResponse, 200, "csrf");
  mergeResponseCookies(jar, csrfResponse);
  const { csrfToken } = await csrfResponse.json();

  const callbackResponse = await fetch(
    `${baseUrl}/api/auth/callback/credentials?json=true`,
    {
      method: "POST",
      headers: {
        Origin: baseUrl,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: serializeCookies(jar),
      },
      body: new URLSearchParams({
        csrfToken,
        email,
        password,
        json: "true",
      }),
    }
  );
  assertStatus(callbackResponse, 200, "login");
  mergeResponseCookies(jar, callbackResponse);

  if (![...jar.keys()].some((key) => key.endsWith("session-token"))) {
    throw new Error("login: session cookie was not issued");
  }

  return jar;
}

async function getTreeStatus(jar) {
  const response = await fetch(`${baseUrl}/api/trees`, {
    headers: { Cookie: serializeCookies(jar) },
  });
  return response.status;
}

try {
  await prisma.user.create({
    data: {
      name: "Auth Smoke",
      email,
      phone: "081234567890",
      passwordHash: await hash(password, 10),
      role: "user",
      status: "inactive",
      subscriptionActive: false,
    },
  });

  const inactiveJar = await login();
  const inactiveTreeStatus = await getTreeStatus(inactiveJar);
  if (inactiveTreeStatus !== 403) {
    throw new Error(`inactive tree access: expected HTTP 403, got ${inactiveTreeStatus}`);
  }

  await prisma.user.update({
    where: { email },
    data: { status: "active", subscriptionActive: true },
  });

  const activeJar = await login();
  const activeTreeStatus = await getTreeStatus(activeJar);
  if (activeTreeStatus !== 200) {
    throw new Error(`active tree access: expected HTTP 200, got ${activeTreeStatus}`);
  }

  await prisma.user.update({
    where: { email },
    data: { sessionVersion: { increment: 1 } },
  });

  const revokedTreeStatus = await getTreeStatus(activeJar);
  if (revokedTreeStatus !== 403) {
    throw new Error(`revoked tree access: expected HTTP 403, got ${revokedTreeStatus}`);
  }

  smokeResult = { inactiveTreeStatus, activeTreeStatus, revokedTreeStatus };
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}

console.log(JSON.stringify({ ...smokeResult, syntheticUserCleaned: true }));
