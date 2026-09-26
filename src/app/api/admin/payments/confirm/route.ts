import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { fulfillPayment } from "@/lib/payments";

// POST /api/admin/payments/confirm { paymentId } — гар шилжүүлэг баталгаажуулах
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { paymentId } = await req.json();
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p) return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 404 });
  if (p.status !== "PENDING") return NextResponse.json({ error: "PENDING төлбөр биш байна" }, { status: 400 });
  try {
    const done = await fulfillPayment(paymentId);
    return NextResponse.json({ ok: true, orderId: done.orderId, status: done.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Баталгаажуулах үед алдаа" }, { status: 500 });
  }
}
