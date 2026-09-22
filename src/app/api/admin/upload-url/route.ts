import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

// POST /api/admin/upload-url { ext } → { url, path } (ebooks private bucket)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { ext } = await req.json();
  if (!["pdf"].includes((ext || "").toLowerCase())) {
    return NextResponse.json({ error: "Зөвхөн PDF" }, { status: 400 });
  }
  const path = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from("ebooks").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "Upload URL алдаа" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl, path });
}
