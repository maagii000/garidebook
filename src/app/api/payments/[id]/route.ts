import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { syncPayment } from "@/lib/payments";

// GET /api/payments/[id] — төлөв шалгах (QPay-тэй синк хийнэ)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { id } = await params;

  const row = await db.payment.findUnique({ where: { id }, include: { book: { select: { title: true } } } });
  if (!row || row.buyerId !== me.id) return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 404 });

  try {
    const synced = await syncPayment(id);
    const fresh = await db.user.findUnique({ where: { id: me.id }, select: { credit: true } });
    return NextResponse.json({
      id: synced.id,
      status: synced.status,
      amount: synced.amount,
      creditSpent: synced.creditSpent,
      orderId: synced.orderId,
      ebarimtId: synced.ebarimtId,
      bookTitle: row.book.title,
      credit: fresh?.credit ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Шалгах үед алдаа" }, { status: 500 });
  }
}
