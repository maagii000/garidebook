import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, toBook, forbidden } from "@/lib/api-auth";

const bookInclude = { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } };

// GET /api/books/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await db.book.findUnique({ where: { id }, include: bookInclude });
  if (!book) return NextResponse.json({ error: "Ном олдсонгүй" }, { status: 404 });
  let owned = false;
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (uid) {
      const o = await db.order.findFirst({ where: { bookId: id, buyerId: uid, status: "placed" }, select: { id: true } });
      owned = !!o;
    }
  } catch { /* public fallback */ }
  const reviews = await db.review.findMany({
    where: { bookId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    book: toBook(book, owned),
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

// PATCH /api/books/[id] — admin: status/price/classification солих
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { id } = await params;
  const { status, priceCash, classificationCode } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (status !== undefined) {
    if (!["pending", "active", "sold", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Төлөв буруу" }, { status: 400 });
    }
    data.status = status;
  }
  if (priceCash !== undefined) data.priceCash = Math.max(0, Number(priceCash) || 0);
  if (classificationCode !== undefined) data.classificationCode = classificationCode || null;
  const book = await db.book.update({ where: { id }, data, include: bookInclude });
  return NextResponse.json({ book: toBook(book) });
}
