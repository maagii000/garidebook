import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";

// GET /api/admin/overview — тоон мэдээ
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const [total, active, pending, sold, users] = await Promise.all([
    db.book.count(),
    db.book.count({ where: { status: "active" } }),
    db.book.count({ where: { status: "pending" } }),
    db.book.count({ where: { status: "sold" } }),
    db.user.count(),
  ]);
  const pendingBooks = await db.book.findMany({
    where: { status: "pending" },
    include: { owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    counts: { total, active, pending, sold, users },
    pending: pendingBooks.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      ownerName: b.owner.name ?? "—",
      createdAt: b.createdAt,
    })),
  });
}
