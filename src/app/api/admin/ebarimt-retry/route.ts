import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { createEbarimt } from "@/lib/qpay";

// POST /api/admin/ebarimt-retry { paymentId }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { paymentId } = await req.json();
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p) return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 404 });
  if (p.status !== "PAID" || !p.qpayPaymentId) {
    return NextResponse.json({ error: "Төлөгдсөн төлбөр биш байна" }, { status: 400 });
  }
  try {
    const eb = await createEbarimt(p.qpayPaymentId, "CITIZEN");
    const id = (eb as { id?: string }).id;
    await db.payment.update({ where: { id: paymentId }, data: { ebarimtId: id } });
    return NextResponse.json({ ok: true, ebarimtId: id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ebarimt алдаа" }, { status: 500 });
  }
}
