import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncPayment } from "@/lib/payments";

// GET /api/payments/qpay-callback?pid=...&payment_id=... (QPay calls this)
export async function GET(req: NextRequest) {
  const pid = req.nextUrl.searchParams.get("pid");
  if (!pid) return NextResponse.json({ error: "pid missing" }, { status: 400 });
  try {
    const payment = await db.payment.findUnique({ where: { id: pid } });
    if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
    const synced = await syncPayment(pid);
    return NextResponse.json({ ok: true, status: synced.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
