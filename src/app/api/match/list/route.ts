import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

// GET /api/match/list — миний match-ууд (нөгөө талын мэдээлэлтэй)
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const rows = await db.match.findMany({
    where: { OR: [{ aId: me.id }, { bId: me.id }] },
    include: {
      a: { select: { id: true, name: true, nickname: true, school: true, interests: true, bio: true, image: true } },
      b: { select: { id: true, name: true, nickname: true, school: true, interests: true, bio: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    matches: rows.map((m) => {
      const p = m.aId === me.id ? m.b : m.a;
      return {
        id: m.id,
        createdAt: m.createdAt,
        partner: {
          id: p.id,
          name: p.nickname || p.name || "Оюутан",
          school: p.school || "",
          interests: p.interests || "",
          bio: p.bio || "",
          image: p.image,
        },
      };
    }),
  });
}
