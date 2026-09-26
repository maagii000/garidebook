import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { syncPayment } from "@/lib/payments";

// POST /api/admin/payments/sync { paymentId } — QPay PENDING төлбөрийг гараар шалгах
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { paymentId } = await req.json();
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p) return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 404 });
  try {
    const synced = await syncPayment(paymentId);
    return NextResponse.json({ ok: true, status: synced.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Шалгах үед алдаа" }, { status: 500 });
  }
}
