import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";

// GET /api/admin/payments/[id] — төлбөрийн дэлгэрэнгүй (Shopify order view)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { id } = await params;

  const p = await db.payment.findUnique({
    where: { id },
    include: {
      book: { select: { id: true, title: true } },
      order: { select: { id: true, cashPaid: true } },
    },
  });
  if (!p) return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 404 });

  const buyer = await db.user.findUnique({
    where: { id: p.buyerId },
    select: { id: true, name: true, email: true, nickname: true, lastName: true, firstName: true },
  });

  // Зориулалтаас хамаарч холбоотой объект
  let item: { kind: string; id: string | null; title: string } | null = null;
  if (p.book) {
    item = { kind: "book", id: p.book.id, title: p.book.title };
  } else if (p.purpose === "AD_FEE" && p.refId) {
    const a = await db.ad.findUnique({ where: { id: p.refId }, select: { id: true, title: true } });
    if (a) item = { kind: "ad", id: a.id, title: a.title };
  } else if (p.purpose === "MATERIAL" && p.refId) {
    const m = await db.material.findUnique({ where: { id: p.refId }, select: { id: true, title: true } });
    if (m) item = { kind: "material", id: m.id, title: m.title };
  } else if (p.purpose === "MEMBERSHIP") {
    const m = await db.membership.findFirst({
      where: { paymentId: p.id },
      select: { id: true, plan: true },
    });
    if (m) item = { kind: "membership", id: m.id, title: `${m.plan} гишүүнчлэл` };
  }
  if (!item) {
    item = {
      kind: p.purpose.toLowerCase(),
      id: p.refId,
      title:
        p.purpose === "UPLOAD_FEE"
          ? "Файл оруулах хураамж"
          : p.purpose === "AD_FEE"
            ? "Зар байршуулах хураамж"
            : p.purpose === "MEMBERSHIP"
              ? "Гишүүнчлэл"
              : "Номын төлбөр",
    };
  }

  return NextResponse.json({
    payment: {
      id: p.id,
      ref: `LU-${p.id.slice(0, 8).toUpperCase()}`,
      amount: p.amount,
      creditSpent: p.creditSpent,
      purpose: p.purpose,
      status: p.status,
      method: p.method,
      qpayInvoiceId: p.qpayInvoiceId,
      qpayPaymentId: p.qpayPaymentId,
      ebarimtId: p.ebarimtId,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    },
    buyer: buyer
      ? {
          id: buyer.id,
          name: [buyer.lastName, buyer.firstName].filter(Boolean).join(" ") || buyer.nickname || buyer.name || "—",
          email: buyer.email,
        }
      : null,
    item,
    order: p.order ? { id: p.order.id, cashPaid: p.order.cashPaid } : null,
  });
}
