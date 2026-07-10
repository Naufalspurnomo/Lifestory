// Trees collection: list current user's trees, create a new one.
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireActiveSubscriber, requireUser } from "../../../lib/auth-helpers";
import {
  createTreeForUser,
  getFirstTreeWelcomeTreeIdForUser,
  InvalidTreeGraphError,
  listTreesForUser,
} from "../../../lib/tree/repository";
import type { FamilyNode } from "../../../lib/types/tree";
import {
  formatZodErrors,
  treeCreateSchema,
  validateBody,
} from "../../../lib/validations";
import { jsonBodyLimits, parseJsonBody } from "../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";

// Missing persistence tables are an outage, not an empty archive. Returning
// 503 keeps browser caches intact while deployment is repaired.
function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export async function GET() {
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    const [trees, firstTreeWelcomeTreeId] = await Promise.all([
      listTreesForUser(userId),
      getFirstTreeWelcomeTreeIdForUser(userId),
    ]);
    return NextResponse.json({
      trees,
      onboarding: { firstTreeWelcomeTreeId },
    });
  } catch (error) {
    if (error instanceof InvalidTreeGraphError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "tree-tables-not-migrated" },
        { status: 503 }
      );
    }
    console.error("trees list error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-create",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.treeMutation);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(treeCreateSchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  try {
    const result = await createTreeForUser(
      userId,
      validation.data.name,
      validation.data.nodes as FamilyNode[],
      validation.data.id
    );
    return NextResponse.json(
      {
        tree: result.tree,
        onboarding: { firstTreeWelcomeTreeId: result.firstTreeWelcomeTreeId },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "tree-tables-not-migrated" },
        { status: 503 }
      );
    }
    console.error("tree create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
