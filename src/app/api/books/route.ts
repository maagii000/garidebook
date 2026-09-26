import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, toBook, unauthorized } from "@/lib/api-auth";

const bookInclude = { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } };

// GET /api/books?status=&source=&category=&q=&sort=&mine=1
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const source = sp.get("source");
  const category = sp.get("category");
  const q = sp.get("q")?.trim();
  const sort = sp.get("sort") || "new";
  const mine = sp.get("mine") === "1";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (mine) {
    const me = await requireUser();
    if (!me) return unauthorized();
    where.ownerId = me.id;
  } else if (status) {
    where.status = status;
  } else {
    where.status = { not: "rejected" };
  }
  if (source && source !== "all") where.source = source;
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "rating"
      ? [{ avgRating: "desc" as const }]
      : sort === "price"
        ? [{ priceCash: "asc" as const }]
        : [{ createdAt: "desc" as const }];

  const books = await db.book.findMany({ where, include: bookInclude, orderBy, take: 200 });
  let ownedSet = new Set<string>();
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (uid) {
      const os = await db.order.findMany({ where: { buyerId: uid, status: "placed" }, select: { bookId: true } });
      ownedSet = new Set(os.map((o) => o.bookId));
    }
  } catch { /* public fallback */ }
  return NextResponse.json(
    { books: books.map((b) => toBook(b, ownedSet.has(b.id))) },
    mine ? undefined : { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
