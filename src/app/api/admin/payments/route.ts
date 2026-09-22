import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";

// GET /api/admin/payments — төлбөрүүд + ebarimt төлөв
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const rows = await db.payment.findMany({
    include: {
      book: { select: { title: true } },
      order: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const buyerIds = [...new Set(rows.map((r) => r.buyerId))];
  const users = await db.user.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true, email: true } });
  const umap = new Map(users.map((u) => [u.id, u]));
  return NextResponse.json({
    payments: rows.map((p) => ({
      id: p.id,
      bookTitle: p.book.title,
      buyer: umap.get(p.buyerId)?.name ?? umap.get(p.buyerId)?.email ?? "—",
      amount: p.amount,
      creditSpent: p.creditSpent,
      status: p.status,
      qpayInvoiceId: p.qpayInvoiceId,
      qpayPaymentId: p.qpayPaymentId,
      ebarimtId: p.ebarimtId,
      orderId: p.orderId,
      createdAt: p.createdAt,
    })),
  });
}
