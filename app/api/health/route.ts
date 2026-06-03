import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { isDatabaseHealthCheckAuthorized } from "../../../lib/health-auth";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("database") === "1") {
    if (!isDatabaseHealthCheckAuthorized(request.headers)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: noStoreHeaders }
      );
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      return NextResponse.json(
        { ok: true, database: "reachable" },
        { headers: noStoreHeaders }
      );
    } catch (error) {
      console.error("database health check failed", error);
      return NextResponse.json(
        { ok: false, database: "unreachable" },
        { status: 503, headers: noStoreHeaders }
      );
    }
  }

  return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
}
