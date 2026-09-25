import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin, unauthorized } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { materialAccess } from "../../route";

// GET /api/hub/[id]/file — хандах эрхтэй бол signed download URL
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const m = await db.material.findUnique({ where: { id } });
  if (!m || m.status !== "active" || !m.filePath) {
    return NextResponse.json({ error: "Материал олдсонгүй" }, { status: 404 });
  }
  const isAdmin = (await requireAdmin()) !== null;
  const ok = await materialAccess(me.id, isAdmin, m);
  if (!ok) return NextResponse.json({ error: "Эрх хүрэхгүй — худалдаж авна уу" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from("ebooks").createSignedUrl(m.filePath, 3600);
  if (error || !data) return NextResponse.json({ error: "Файл нээхэд алдаа" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl, fileName: m.fileName });
}
