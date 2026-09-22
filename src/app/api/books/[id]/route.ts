import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, toBook, forbidden } from "@/lib/api-auth";

const bookInclude = { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } };

// GET /api/books/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await db.book.findUnique({ where: { id }, include: bookInclude });
  if (!book) return NextResponse.json({ error: "Ном олдсонгүй" }, { status: 404 });
  const reviews = await db.review.findMany({
    where: { bookId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    book: toBook(book),
    reviews: reviews.map((r) => ({
      id: r.id,
      bookId: r.bookId,
      userName: r.user.name ?? "—",
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
    })),
  });
}

// PATCH /api/books/[id] — admin: status солих
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { id } = await params;
  const { status } = await req.json();
  if (!["pending", "active", "sold", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Төлөв буруу" }, { status: 400 });
  }
  const book = await db.book.update({ where: { id }, data: { status }, include: bookInclude });
  return NextResponse.json({ book: toBook(book) });
}
