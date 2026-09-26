import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized, forbidden } from "@/lib/api-auth";

// DM өрөөнд зөвхөн match-ийн 2 тал хандах боломжтой
async function checkRoomAccess(roomId: string, userId: string | null) {
  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: { match: { select: { aId: true, bId: true } } },
  });
  if (!room) return { error: "Өрөө олдсонгүй" as const, status: 404 as const };
  if (room.matchId && room.match) {
    if (!userId || (room.match.aId !== userId && room.match.bId !== userId)) {
      return { error: "Эрх хүрэхгүй" as const, status: 403 as const };
    }
  }
  return { room };
}

// GET /api/chat/rooms/[id]/messages?after=ISO — сүүлийн 100
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let userId: string | null = null;
  try {
    const me = await requireUser();
    userId = me?.id ?? null;
  } catch { /* public */ }
  const access = await checkRoomAccess(id, userId);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const after = req.nextUrl.searchParams.get("after");
  const where: { roomId: string; createdAt?: { gt: Date } } = { roomId: id };
  if (after) {
    const d = new Date(after);
    if (!isNaN(d.getTime())) where.createdAt = { gt: d };
  }
  const rows = await db.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      text: m.text,
      createdAt: m.createdAt,
    })),
  });
}

// POST /api/chat/rooms/[id]/messages { text } — 3с rate limit
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const { text } = await req.json();
  const t = String(text || "").trim().slice(0, 500);
  if (!t) return NextResponse.json({ error: "Хоосон мессеж" }, { status: 400 });

  const room = await db.chatRoom.findUnique({ where: { id } });
  if (!room) return NextResponse.json({ error: "Өрөө олдсонгүй" }, { status: 404 });
  if (room.matchId) {
    const m = await db.match.findUnique({ where: { id: room.matchId }, select: { aId: true, bId: true } });
    if (!m || (m.aId !== me.id && m.bId !== me.id)) return forbidden("Эрх хүрэхгүй");
  }

  const last = await db.chatMessage.findFirst({
    where: { roomId: id, userId: me.id },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < 3000) {
    return NextResponse.json({ error: "Түр хүлээнэ үү" }, { status: 429 });
  }

  const m = await db.chatMessage.create({
    data: {
      roomId: id,
      userId: me.id,
      userName: me.name ?? me.email?.split("@")[0] ?? "Уншигч",
      text: t,
    },
  });
  return NextResponse.json({
    message: { id: m.id, userId: m.userId, userName: m.userName, text: m.text, createdAt: m.createdAt },
  });
}
