import { NextRequest, NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const ALLOWED = ["pdf", "doc", "docx", "ppt", "pptx", "zip", "jpg", "jpeg", "png", "webp"];

// POST /api/hub/upload-url { ext, name } → { url, path } (ebooks private bucket, hub/ prefix)
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { ext } = await req.json();
  const e = String(ext || "").toLowerCase().replace(/^\./, "");
  if (!ALLOWED.includes(e)) {
    return NextResponse.json({ error: "Зөвшөөрөгдсөн: PDF, Word, PPT, ZIP, зураг" }, { status: 400 });
  }
  const path = `hub/${me.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${e}`;
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from("ebooks").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "Upload URL алдаа" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl, path });
}
