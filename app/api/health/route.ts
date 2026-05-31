import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("database") === "1") {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return NextResponse.json({ ok: true, database: "reachable" });
    } catch (error) {
      console.error("database health check failed", error);
      return NextResponse.json(
        { ok: false, database: "unreachable" },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
