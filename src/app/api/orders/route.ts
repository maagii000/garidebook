import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

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
      createdAt: o.createdAt,
    })),
  });
}

// POST /api/orders { bookId } — бэлэн мөнгөөр захиалах (P2P физик ном)
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId } = await req.json();

  try {
    const order = await db.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error("Ном олдсонгүй");
      if (book.pdfPath) throw new Error("Ebook-г QPay checkout-оор авна");
      if (book.status === "sold") throw new Error("Аль хэдийн зарагдсан");
      if (book.status !== "active") throw new Error("Ном идэвхтэй биш байна");

      await tx.book.update({ where: { id: bookId }, data: { status: "sold" } });
      return tx.order.create({
        data: { bookId, buyerId: me.id, cashPaid: book.priceCash, creditSpent: 0 },
        include: { book: { select: { title: true } } },
      });
    });

    return NextResponse.json({
      order: {
        id: order.id,
        bookId: order.bookId,
        bookTitle: order.book.title,
        cashPaid: order.cashPaid,
        createdAt: order.createdAt,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Алдаа гарлаа" }, { status: 400 });
  }
}
