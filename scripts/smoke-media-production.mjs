import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.MEDIA_SMOKE_BASE_URL?.replace(/\/$/, "");

if (process.env.ALLOW_MEDIA_SMOKE !== "1" || !baseUrl) {
  throw new Error(
    "Set ALLOW_MEDIA_SMOKE=1 and MEDIA_SMOKE_BASE_URL before running media smoke."
  );
}

if (process.env.MEDIA_SMOKE_USE_DIRECT_URL !== "0" && process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();
const runId = `${Date.now()}-${randomUUID()}`;
const smokeIp = `smoke-${runId}`;
const password = "SmokePass123";
const email = `media-smoke-${runId}@example.com`;
let smokeResult;

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`);
  }
}

function assertOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label}: expected HTTP 2xx, got ${response.status}`);
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

async function createUser() {
  await prisma.user.create({
    data: {
      name: "Media Smoke",
      email,
      phone: "081234567890",
      passwordHash: await hash(password, 10),
      role: "user",
      status: "active",
      subscriptionActive: true,
    },
  });
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
        "x-forwarded-for": smokeIp,
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
  return jar;
}

function authHeaders(jar, extra = {}) {
  return {
    Origin: baseUrl,
    "x-forwarded-for": smokeIp,
    Cookie: serializeCookies(jar),
    ...extra,
  };
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
    imageStorageKey: null,
    imageMimeType: null,
    imageSizeBytes: null,
    content: { description: "", media: [] },
    works: [],
  };
}

async function createTree(jar) {
  const root = person(`node-${randomUUID()}`, "Media Smoke Root");
  const response = await fetch(`${baseUrl}/api/trees`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: "Media Smoke Tree",
      nodes: [root],
    }),
  });
  assertStatus(response, 201, "create tree");
  return response.json();
}

async function presign(jar, treeId, nodeId) {
  const response = await fetch(`${baseUrl}/api/media/presign`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      treeId,
      nodeId,
      purpose: "profile",
      fileName: "media-smoke.png",
      contentType: "image/png",
      sizeBytes: onePixelPng.byteLength,
    }),
  });
  assertStatus(response, 200, "presign media upload");
  return response.json();
}

async function upload(uploadPlan) {
  const response = await fetch(uploadPlan.uploadUrl, {
    method: uploadPlan.method,
    headers: uploadPlan.headers,
    body: onePixelPng,
  });
  assertOk(response, "object upload");
  return response.status;
}

async function verifyPublicUrl(asset) {
  const response = await fetch(asset.url, { method: "GET" });
  assertOk(response, "public media URL");
  return response.status;
}

async function syncProfile(jar, tree, asset) {
  const root = tree.nodes[0];
  const updated = {
    ...root,
    imageUrl: asset.url,
    imageStorageKey: asset.storageKey,
    imageMimeType: asset.mimeType,
    imageSizeBytes: asset.sizeBytes,
  };
  const response = await fetch(`${baseUrl}/api/trees/${tree.id}/sync`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      batchId: `media-smoke-${randomUUID()}`,
      clientVersion: tree.version,
      mutations: [
        {
          seqNo: 1,
          type: "update",
          nodeId: root.id,
          payload: updated,
          previousPayload: root,
        },
      ],
    }),
  });
  assertStatus(response, 200, "sync profile media metadata");
  return response.json();
}

async function clearProfile(jar, tree, asset, clientVersion) {
  const root = tree.nodes[0];
  const cleared = {
    ...root,
    imageUrl: null,
    imageStorageKey: null,
    imageMimeType: null,
    imageSizeBytes: null,
  };
  const response = await fetch(`${baseUrl}/api/trees/${tree.id}/sync`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      batchId: `media-smoke-clear-${randomUUID()}`,
      clientVersion,
      mutations: [
        {
          seqNo: 1,
          type: "update",
          nodeId: root.id,
          payload: cleared,
          previousPayload: {
            ...root,
            imageUrl: asset.url,
            imageStorageKey: asset.storageKey,
            imageMimeType: asset.mimeType,
            imageSizeBytes: asset.sizeBytes,
          },
        },
      ],
    }),
  });
  assertStatus(response, 200, "clear profile media metadata");
  return response.json();
}

async function deleteObject(jar, treeId, storageKey, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/media/delete`, {
    method: "POST",
    headers: authHeaders(jar, { "Content-Type": "application/json" }),
    body: JSON.stringify({ treeId, storageKey }),
  });
  assertStatus(response, expectedStatus, "delete media object");
  return response.status;
}

try {
  await createUser();
  const jar = await login();
  const { tree } = await createTree(jar);
  const abandonedPlan = await presign(jar, tree.id, tree.nodes[0].id);
  const abandonedUploadStatus = await upload(abandonedPlan);
  const deleteStatus = await deleteObject(
    jar,
    tree.id,
    abandonedPlan.asset.storageKey
  );
  const uploadPlan = await presign(jar, tree.id, tree.nodes[0].id);
  const uploadStatus = await upload(uploadPlan);
  const publicUrlStatus = await verifyPublicUrl(uploadPlan.asset);
  const syncResult = await syncProfile(jar, tree, uploadPlan.asset);
  const referencedDeleteStatus = await deleteObject(
    jar,
    tree.id,
    uploadPlan.asset.storageKey,
    422
  );
  const clearResult = await clearProfile(
    jar,
    tree,
    uploadPlan.asset,
    syncResult.newVersion
  );

  smokeResult = {
    presignStatus: 200,
    abandonedUploadStatus,
    deleteStatus,
    uploadStatus,
    publicUrlStatus,
    syncStatus: 200,
    referencedDeleteStatus,
    clearStatus: 200,
    finalVersion: clearResult.newVersion,
  };
} finally {
  const syntheticUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (syntheticUser) {
    await prisma.$transaction([
      prisma.tree.deleteMany({ where: { ownerId: syntheticUser.id } }),
      prisma.familyIdentity.deleteMany({
        where: { createdById: syntheticUser.id },
      }),
      prisma.user.delete({ where: { email } }),
    ]);
  }
  await prisma.$disconnect();
}

console.log(JSON.stringify({ ...smokeResult, syntheticUserCleaned: true }));
