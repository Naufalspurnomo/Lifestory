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
const runId = `${Date.now()}-${randomUUID()}`;
const password = "SmokePass123";
const emails = {
  purchaser: `auth-smoke-purchaser-${runId}@example.com`,
  collaborator: `auth-smoke-collaborator-${runId}@example.com`,
  outsider: `auth-smoke-outsider-${runId}@example.com`,
};
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

async function createUser(email, subscriptionActive = false) {
  await prisma.user.create({
    data: {
      name: "Auth Smoke",
      email,
      phone: "081234567890",
      passwordHash: await hash(password, 10),
      role: "user",
      status: subscriptionActive ? "active" : "inactive",
      subscriptionActive,
    },
  });
}

async function login(email) {
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

function authHeaders(jar, extra = {}) {
  return {
    Origin: baseUrl,
    Cookie: serializeCookies(jar),
    ...extra,
  };
}

async function getTreeListStatus(jar) {
  const response = await fetch(`${baseUrl}/api/trees`, {
    headers: authHeaders(jar),
  });
  return response.status;
}

async function getTreeStatus(jar, treeId) {
  const response = await fetch(`${baseUrl}/api/trees/${treeId}`, {
    headers: authHeaders(jar),
  });
  return response.status;
}

function person(id, label) {
  return {
    id,
    label,
    year: null,
    deathYear: null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: 0,
    line: "default",
    imageUrl: null,
    content: { description: "", media: [] },
    works: [],
  };
}

async function createTree(jar, expectedStatus = 201) {
  const root = person(`node-${randomUUID()}`, "Auth Smoke Root");
  const response = await fetch(`${baseUrl}/api/trees`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: "Auth Smoke Tree",
      nodes: [root],
    }),
  });
  assertStatus(response, expectedStatus, "create tree");
  if (!response.ok) return null;
  const { tree } = await response.json();
  return tree;
}

async function verifySyncMutation(jar, tree) {
  const added = person(`node-${randomUUID()}`, "Auth Smoke Added");
  const syncResponse = await fetch(`${baseUrl}/api/trees/${tree.id}/sync`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      batchId: `auth-smoke-${randomUUID()}`,
      clientVersion: tree.version,
      mutations: [
        {
          seqNo: 1,
          type: "add",
          nodeId: added.id,
          payload: added,
        },
      ],
    }),
  });
  assertStatus(syncResponse, 200, "sync mutation");
  return syncResponse.status;
}

async function createInvite(jar, treeId) {
  const response = await fetch(`${baseUrl}/api/invites`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({ treeId, role: "editor" }),
  });
  assertStatus(response, 200, "create invite");
  return response.json();
}

async function inspectPublicInvite(inviteLink) {
  const response = await fetch(inviteLink);
  assertStatus(response, 200, "get invite");
  const payload = await response.json();
  if ("treeData" in payload) {
    throw new Error("get invite: public metadata leaked treeData");
  }
  return response.status;
}

async function acceptInvite(jar, token) {
  const response = await fetch(`${baseUrl}/api/invites/${token}`, {
    method: "POST",
    headers: authHeaders(jar),
  });
  assertStatus(response, 200, "accept invite");
  return response.status;
}

try {
  await createUser(emails.purchaser);
  const inactivePurchaserJar = await login(emails.purchaser);
  const inactiveTreeListStatus = await getTreeListStatus(inactivePurchaserJar);
  if (inactiveTreeListStatus !== 200) {
    throw new Error(
      `inactive tree list: expected HTTP 200, got ${inactiveTreeListStatus}`
    );
  }
  await createTree(inactivePurchaserJar, 403);

  await prisma.user.update({
    where: { email: emails.purchaser },
    data: { status: "active", subscriptionActive: true },
  });

  const purchaserJar = await login(emails.purchaser);
  const activeTreeListStatus = await getTreeListStatus(purchaserJar);
  if (activeTreeListStatus !== 200) {
    throw new Error(
      `active tree list: expected HTTP 200, got ${activeTreeListStatus}`
    );
  }
  const tree = await createTree(purchaserJar);
  const syncMutationStatus = await verifySyncMutation(purchaserJar, tree);

  await createUser(emails.collaborator);
  const collaboratorJar = await login(emails.collaborator);
  const invite = await createInvite(purchaserJar, tree.id);
  const publicInviteStatus = await inspectPublicInvite(invite.inviteLink);
  const inviteAcceptStatus = await acceptInvite(collaboratorJar, invite.token);
  const collaboratorTreeStatus = await getTreeStatus(collaboratorJar, tree.id);
  if (collaboratorTreeStatus !== 200) {
    throw new Error(
      `collaborator tree access: expected HTTP 200, got ${collaboratorTreeStatus}`
    );
  }

  await createUser(emails.outsider);
  const outsiderJar = await login(emails.outsider);
  const outsiderTreeStatus = await getTreeStatus(outsiderJar, tree.id);
  if (outsiderTreeStatus !== 403) {
    throw new Error(
      `outsider tree access: expected HTTP 403, got ${outsiderTreeStatus}`
    );
  }

  await prisma.user.update({
    where: { email: emails.purchaser },
    data: { sessionVersion: { increment: 1 } },
  });

  const revokedTreeStatus = await getTreeListStatus(purchaserJar);
  if (revokedTreeStatus !== 403) {
    throw new Error(
      `revoked tree access: expected HTTP 403, got ${revokedTreeStatus}`
    );
  }

  smokeResult = {
    inactiveTreeListStatus,
    inactiveTreeCreateStatus: 403,
    activeTreeListStatus,
    syncMutationStatus,
    publicInviteStatus,
    inviteAcceptStatus,
    collaboratorTreeStatus,
    outsiderTreeStatus,
    revokedTreeStatus,
  };
} finally {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();
}

console.log(JSON.stringify({ ...smokeResult, syntheticUsersCleaned: true }));
