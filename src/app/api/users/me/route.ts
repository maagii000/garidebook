import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

// GET /api/users/me — танилцуулга
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  return NextResponse.json({
    me: {
      name: me.name,
      nickname: (me as { nickname?: string | null }).nickname ?? "",
      bio: (me as { bio?: string }).bio ?? "",
      school: (me as { school?: string }).school ?? "",
      interests: (me as { interests?: string }).interests ?? "",
    },
  });
}

// PATCH /api/users/me { nickname, bio, school, interests } — swipe профайл
export async function PATCH(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { nickname, bio, school, interests } = await req.json();
  const updated = await db.user.update({
    where: { id: me.id },
    data: {
      nickname: String(nickname || "").trim().slice(0, 30) || null,
      bio: String(bio || "").trim().slice(0, 300),
      school: String(school || "").trim().slice(0, 80),
      interests: String(interests || "").trim().slice(0, 120),
    },
  });
  return NextResponse.json({ ok: true });
}
