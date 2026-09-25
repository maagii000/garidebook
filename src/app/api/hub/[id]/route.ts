import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin, forbidden } from "@/lib/api-auth";
import { materialAccess } from "../route";

// GET /api/hub/[id] — дэлгэрэнгүй + хандах эрх
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.material.findUnique({
    where: { id },
    include: { owner: { select: { name: true } } },
  });
  if (!m || m.status === "rejected") {
    return NextResponse.json({ error: "Материал олдсонгүй" }, { status: 404 });
  }
  let userId: string | null = null;
  let isAdmin = false;
  try {
    const me = await requireUser();
    if (me) {
      userId = me.id;
      isAdmin = (await requireAdmin()) !== null;
    }
  } catch { /* public */ }
  const access = await materialAccess(userId, isAdmin, m);
  return NextResponse.json({
    material: {
      id: m.id,
      title: m.title,
      subject: m.subject,
      description: m.description,
      fileName: m.fileName,
      fileSize: m.fileSize,
      price: m.price,
      status: m.status,
      ownerName: m.owner?.name ?? "—",
      createdAt: m.createdAt,
      canAccess: access,
    },
  });
}

// PATCH /api/hub/[id] { status } — админ approve/reject
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { id } = await params;
  const { status } = await req.json();
  if (!["active", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Төлөв буруу" }, { status: 400 });
  }
  const updated = await db.material.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true, status: updated.status });
}
