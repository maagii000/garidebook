import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { CREDIT_TO_MNT, MAX_CREDIT_USE_PER_ORDER } from "@/lib/types";

// GET /api/orders — миний захиалгууд
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const orders = await db.order.findMany({
    where: { buyerId: me.id },
    include: { book: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      bookId: o.bookId,
      bookTitle: o.book.title,
      cashPaid: o.cashPaid,
      creditSpent: o.creditSpent,
      createdAt: o.createdAt,
    })),
  });
}

// POST /api/orders { bookId, creditToUse }
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId, creditToUse } = await req.json();

  try {
    const order = await db.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error("Ном олдсонгүй");
      if (book.status === "sold") throw new Error("Аль хэдийн зарагдсан");
      if (book.status !== "active") throw new Error("Ном идэвхтэй биш байна");

      const buyer = await tx.user.findUnique({ where: { id: me.id } });
      if (!buyer) throw new Error("Хэрэглэгч олдсонгүй");

      const use = Math.max(
        0,
        Math.min(Number(creditToUse) || 0, buyer.credit, MAX_CREDIT_USE_PER_ORDER, Math.floor(book.priceCash / CREDIT_TO_MNT))
      );
      const cashPaid = book.priceCash - use * CREDIT_TO_MNT;

      if (use > 0) {
        await tx.user.update({ where: { id: me.id }, data: { credit: { decrement: use } } });
        await tx.creditTx.create({
          data: { userId: me.id, amount: -use, reason: "Худалдан авалтад зарцуулсан", bookId },
        });
      }
      await tx.book.update({ where: { id: bookId }, data: { status: "sold" } });
      return tx.order.create({
        data: { bookId, buyerId: me.id, cashPaid, creditSpent: use },
        include: { book: { select: { title: true } } },
      });
    });

    const fresh = await db.user.findUnique({ where: { id: me.id }, select: { credit: true } });
    return NextResponse.json({
      order: {
        id: order.id,
        bookId: order.bookId,
        bookTitle: order.book.title,
        cashPaid: order.cashPaid,
        creditSpent: order.creditSpent,
        createdAt: order.createdAt,
      },
      credit: fresh?.credit ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 400 });
  }
}
