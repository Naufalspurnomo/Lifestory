import { NextResponse } from "next/server";
import { isCronAuthorized } from "../../../../lib/cron-auth";
import { processDueWhatsAppWelcomeJobs } from "../../../../lib/whatsapp";

export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueWhatsAppWelcomeJobs(
      process.env.NEXTAUTH_URL || new URL(request.url).origin
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("WhatsApp welcome cron failed", error);
    return NextResponse.json({ error: "WhatsApp welcome processing failed" }, { status: 500 });
  }
}
