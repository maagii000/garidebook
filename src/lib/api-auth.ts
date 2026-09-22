import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) return null;
  const id = (session.user as { id: string }).id;
  const user = await db.user.findUnique({ where: { id } });
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export function unauthorized(msg = "Нэвтрэх шаардлагатай") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

export function forbidden(msg = "Эрх хүрэхгүй") {
  return NextResponse.json({ error: msg }, { status: 403 });
}

// Prisma book → frontend shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toBook(b: any, owned = false) {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    category: b.category,
    condition: b.condition,
    description: b.description,
    source: b.source,
    status: b.status,
    priceCash: b.priceCash,
    ownerName: b.owner?.name ?? "—",
    images: (b.images ?? []).map((i: { url: string }) => i.url),
    avgRating: b.avgRating,
    reviewCount: b.reviewCount,
    createdAt: b.createdAt,
    hasPdf: !!b.pdfPath,
    hasAi: !!b.pdfPath && !!b.textReady,
    pages: b.pages ?? undefined,
    coverUrl: b.coverUrl ?? undefined,
    owned,
  };
}
