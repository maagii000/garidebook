import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

// POST /api/books/[id]/reviews { rating, text }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const { rating, text } = await req.json();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Үнэлгээ 1–5 байх ёстой" }, { status: 400 });
  }
  if (!text?.trim()) {
    return NextResponse.json({ error: "Сэтгэгдэл хоосон байна" }, { status: 400 });
  }
  const book = await db.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Ном олдсонгүй" }, { status: 404 });

  await db.review.upsert({
    where: { bookId_userId: { bookId: id, userId: me.id } },
    update: { rating, text: text.trim() },
    create: { bookId: id, userId: me.id, rating, text: text.trim() },
  });

  const agg = await db.review.aggregate({ where: { bookId: id }, _avg: { rating: true }, _count: true });
  const updated = await db.book.update({
    where: { id },
    data: { avgRating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
    select: { avgRating: true, reviewCount: true },
  });
  return NextResponse.json({ ok: true, ...updated });
}
