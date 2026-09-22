import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, toBook, unauthorized } from "@/lib/api-auth";

const bookInclude = { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } };

// GET /api/wishlist — { ids, books }
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const rows = await db.wishlist.findMany({
    where: { userId: me.id },
    include: { book: { include: bookInclude } },
    orderBy: { book: { createdAt: "desc" } },
  });
  return NextResponse.json({
    ids: rows.map((r) => r.bookId),
    books: rows.map((r) => toBook(r.book)),
  });
}

// POST /api/wishlist { bookId } — toggle
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId } = await req.json();
  if (!bookId) return NextResponse.json({ error: "bookId шаардлагатай" }, { status: 400 });
  const existing = await db.wishlist.findUnique({
    where: { userId_bookId: { userId: me.id, bookId } },
  });
  if (existing) {
    await db.wishlist.delete({ where: { userId_bookId: { userId: me.id, bookId } } });
    return NextResponse.json({ wished: false });
  }
  await db.wishlist.create({ data: { userId: me.id, bookId } });
  return NextResponse.json({ wished: true });
}
