import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { cancelInvoice } from "@/lib/qpay";

// POST /api/admin/payments/cancel { paymentId }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { paymentId } = await req.json();
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p) return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 404 });
  if (p.status !== "PENDING") return NextResponse.json({ error: "PENDING төлбөр биш байна" }, { status: 400 });
  if (p.qpayInvoiceId) {
    try { await cancelInvoice(p.qpayInvoiceId); } catch { /* ignore */ }
  }
  await db.payment.update({ where: { id: paymentId }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
