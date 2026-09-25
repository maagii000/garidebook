import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";

// GET /api/admin/ads — шалгагдаж байгаа зарууд
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const rows = await db.ad.findMany({
    where: { status: "pending" },
    include: { owner: { select: { name: true, email: true } }, images: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    ads: rows.map((a) => ({
      id: a.id,
      title: a.title,
      price: a.price,
      description: a.description,
      contact: a.contact,
      owner: a.owner?.name ?? a.owner?.email ?? "—",
      image: a.images[0]?.url ?? null,
      createdAt: a.createdAt,
    })),
  });
}
