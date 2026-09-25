import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { AD_FEE } from "@/lib/payments";

const adInclude = { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAd(a: any) {
  return {
    id: a.id,
    title: a.title,
    price: a.price,
    description: a.description,
    contact: a.contact,
    status: a.status,
    feePaid: a.feePaid,
    ownerName: a.owner?.name ?? "—",
    images: (a.images ?? []).map((i: { url: string }) => i.url),
    createdAt: a.createdAt,
  };
}

// GET /api/ads?mine=1&q=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mine = sp.get("mine") === "1";
  const q = sp.get("q")?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (mine) {
    const me = await requireUser();
    if (!me) return unauthorized();
    where.ownerId = me.id;
  } else {
    where.status = "active";
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const ads = await db.ad.findMany({
    where,
    include: adInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ ads: ads.map(toAd) });
}

// POST /api/ads — 500₮ хураамж төлсний дараа зар нийтлэх
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { title, price, description, contact, images, paymentId } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Зарын гарчиг шаардлагатай" }, { status: 400 });
  }
  const priceNum = Math.floor(Number(price) || 0);
  if (priceNum <= 0) {
    return NextResponse.json({ error: "Үнэ буруу" }, { status: 400 });
  }

  const pay = await db.payment.findUnique({ where: { id: paymentId } });
  if (
    !pay || pay.buyerId !== me.id || pay.purpose !== "AD_FEE" ||
    pay.status !== "PAID" || pay.amount < AD_FEE
  ) {
    return NextResponse.json({ error: "Эхлээд 500₮ байршуулах хураамж төлнө үү" }, { status: 402 });
  }

  const urls: string[] = Array.isArray(images) ? images.slice(0, 3) : [];
  const ad = await db.ad.create({
    data: {
      title: title.trim(),
      price: priceNum,
      description: (description || "").trim(),
      contact: (contact || "").trim(),
      status: "pending",
      feePaid: true,
      paymentId: pay.id,
      ownerId: me.id,
      images: { create: urls.map((url, i) => ({ url, sort: i })) },
    },
    include: adInclude,
  });
  await db.payment.update({ where: { id: pay.id }, data: { refId: ad.id } });
  return NextResponse.json({ ad: toAd(ad) });
}
