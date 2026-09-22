import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";

// GET /api/admin/ai-stats — AI хэрэглээ
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const total = await db.aiQuery.count();
  const byBook = await db.aiQuery.groupBy({ by: ["bookId"], _count: true, orderBy: { _count: { bookId: "desc" } }, take: 20 });
  const bookIds = byBook.map((b) => b.bookId);
  const books = await db.book.findMany({ where: { id: { in: bookIds } }, select: { id: true, title: true } });
  const tmap = new Map(books.map((b) => [b.id, b.title]));
  return NextResponse.json({
    total,
    byBook: byBook.map((b) => ({ bookId: b.bookId, title: tmap.get(b.bookId) ?? b.bookId, count: b._count })),
  });
}
