import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processOrderEmails } from "@/lib/email/orderOutbox";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const supplied = Buffer.from(req.headers.get("authorization") ?? "");
  if (!secret || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await processOrderEmails();
    return NextResponse.json(result, { status: result.failed ? 503 : 200 });
  } catch (error) {
    console.error("Email queue processing failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Email queue unavailable; check server configuration" }, { status: 503 });
  }
}
