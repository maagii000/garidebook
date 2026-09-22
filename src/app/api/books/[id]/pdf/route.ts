import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized, forbidden } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/books/[id]/pdf — signed URL (10 мин). Зөвхөн худалдаж авсан + admin.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { id } = await params;

  const book = await db.book.findUnique({ where: { id }, select: { pdfPath: true } });
  if (!book?.pdfPath) return NextResponse.json({ error: "Ebook файл байхгүй" }, { status: 404 });

  const isAdmin = me.role === "ADMIN";
  const owned = isAdmin
    ? true
    : !!(await db.order.findFirst({ where: { bookId: id, buyerId: me.id, status: "placed" }, select: { id: true } }));
  if (!owned) return forbidden("Эхлээд худалдаж аваарай");

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from("ebooks").createSignedUrl(book.pdfPath, 600);
  if (error || !data) return NextResponse.json({ error: "Файл нээхэд алдаа" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
