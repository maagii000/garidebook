import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews?take=6 — сүүлийн ревьюнүүд (book + user нэртэй)
export async function GET(req: NextRequest) {
  const take = Math.min(12, Math.max(1, Number(req.nextUrl.searchParams.get("take")) || 6));
  const rows = await db.review.findMany({
    include: {
      book: { select: { id: true, title: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      bookId: r.book.id,
      bookTitle: r.book.title,
      userName: r.user.name ?? r.user.email?.split("@")[0] ?? "Уншигч",
      createdAt: r.createdAt,
    })),
  });
}
