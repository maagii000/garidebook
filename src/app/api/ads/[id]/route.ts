import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin, unauthorized, forbidden } from "@/lib/api-auth";

// GET /api/ads/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.ad.findUnique({
    where: { id },
    include: { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } },
  });
  if (!a || a.status === "rejected") {
    return NextResponse.json({ error: "Зар олдсонгүй" }, { status: 404 });
  }
  return NextResponse.json({
    ad: {
      id: a.id,
      title: a.title,
      price: a.price,
      description: a.description,
      contact: a.contact,
      status: a.status,
      ownerName: a.owner?.name ?? "—",
      images: a.images.map((i) => i.url),
      createdAt: a.createdAt,
    },
  });
}

// PATCH /api/ads/[id] { status } — эзэмшигч sold болгоно, админ approve/reject
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const { status } = await req.json();

  const a = await db.ad.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ error: "Зар олдсонгүй" }, { status: 404 });

  const isAdmin = (await requireAdmin()) !== null;
  if (isAdmin && ["active", "rejected"].includes(status)) {
    const updated = await db.ad.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true, status: updated.status });
  }
  if (a.ownerId === me.id && status === "sold") {
    const updated = await db.ad.update({ where: { id }, data: { status: "sold" } });
    return NextResponse.json({ ok: true, status: updated.status });
  }
  return forbidden("Эрх хүрэхгүй");
}
