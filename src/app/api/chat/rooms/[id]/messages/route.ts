import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

// GET /api/chat/rooms/[id]/messages?after=ISO — сүүлийн 100
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
