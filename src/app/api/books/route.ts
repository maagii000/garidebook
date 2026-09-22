import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, toBook, unauthorized } from "@/lib/api-auth";
import { CREDIT_FOR_CONDITION, MAX_CREDIT_PER_DAY } from "@/lib/types";

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
  // owned map (optional session)
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
  return NextResponse.json({ books: books.map((b) => toBook(b, ownedSet.has(b.id))) });
}

// POST /api/books — ном оруулах + авто-кредит
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();

  const body = await req.json();
  const { title, author, category, condition, description, images } = body;
  if (!title?.trim() || !author?.trim()) {
    return NextResponse.json({ error: "Нэр + зохиолч шаардлагатай" }, { status: 400 });
  }
  if (!["children", "fiction", "textbook", "self_help", "biography"].includes(category)) {
    return NextResponse.json({ error: "Ангилал буруу" }, { status: 400 });
  }
  if (!["new", "like_new", "good", "used"].includes(condition)) {
    return NextResponse.json({ error: "Төлөв буруу" }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await db.creditTx.count({
    where: { userId: me.id, reason: { startsWith: "Ном оруулсан" }, createdAt: { gte: todayStart } },
  });
  if (todayCount >= MAX_CREDIT_PER_DAY) {
    return NextResponse.json({ error: "Өдөрт дээд тал нь 3 номын кредит авах боломжтой." }, { status: 429 });
  }

  const earned = CREDIT_FOR_CONDITION[condition as keyof typeof CREDIT_FOR_CONDITION] ?? 80;
  const urls: string[] = Array.isArray(images) ? images.slice(0, 3) : [];

  const result = await db.$transaction(async (tx) => {
    const book = await tx.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        category,
        condition,
        description: (description || "").trim() || "Тайлбар бичигдээгүй.",
        source: "user",
        status: "pending",
        priceCash: 5000,
        ownerId: me.id,
        images: { create: urls.map((url, i) => ({ url, sort: i })) },
      },
      include: bookInclude,
    });
    await tx.creditTx.create({
      data: { userId: me.id, amount: earned, reason: `Ном оруулсан +${earned}`, bookId: book.id },
    });
    const user = await tx.user.update({
      where: { id: me.id },
      data: { credit: { increment: earned } },
      select: { credit: true },
    });
    return { book, credit: user.credit };
  });

  return NextResponse.json({ book: toBook(result.book), earned, credit: result.credit });
}
