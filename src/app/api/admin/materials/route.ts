import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";

// GET /api/admin/materials — шалгагдаж байгаа материалууд
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const rows = await db.material.findMany({
    where: { status: "pending" },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    materials: rows.map((m) => ({
      id: m.id,
      title: m.title,
      subject: m.subject,
      description: m.description,
      fileName: m.fileName,
      fileSize: m.fileSize,
      price: m.price,
      owner: m.owner?.name ?? m.owner?.email ?? "—",
      createdAt: m.createdAt,
    })),
  });
}
