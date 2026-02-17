import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth-helpers";
import { getTreeByOwnerId, upsertTreeForOwner } from "../../../lib/treeStore";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import type { TreeData } from "../../../lib/types/tree";

export async function GET(request: Request) {
  const rateLimitError = applyRateLimit(
    request,
    "tree-get",
    rateLimitConfigs.api
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;

  const ownerId = authResult.session.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tree = await getTreeByOwnerId(ownerId);
    return NextResponse.json({ tree });
  } catch (error) {
    console.error("Failed to load user tree:", error);
    return NextResponse.json(
      { error: "Failed to load tree" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const rateLimitError = applyRateLimit(
    request,
    "tree-save",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;

  const ownerId = authResult.session.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name =
    typeof (body as { name?: unknown }).name === "string"
      ? (body as { name: string }).name
      : "";
  const nodes = (body as { nodes?: unknown }).nodes;

  if (!Array.isArray(nodes)) {
    return NextResponse.json({ error: "nodes must be an array" }, { status: 400 });
  }

  try {
    const tree = await upsertTreeForOwner(ownerId, {
      name,
      nodes: nodes as TreeData["nodes"],
    });
    return NextResponse.json({ tree });
  } catch (error) {
    console.error("Failed to save user tree:", error);
    return NextResponse.json(
      { error: "Failed to save tree" },
      { status: 500 }
    );
  }
}
