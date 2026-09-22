import { NextRequest, NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { supabaseAdmin, BOOKS_BUCKET, publicImageUrl } from "@/lib/supabase-server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/uploads — multipart form-data { file } → { url }
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл 5MB-аас ихгүй байх ёстой" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Зөвхөн зураг upload хийж болно" }, { status: 400 });
  }

  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const path = `${me.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const sb = supabaseAdmin();
  const { error } = await sb.storage.from(BOOKS_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: `Upload амжилтгүй: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ url: publicImageUrl(path) });
}
