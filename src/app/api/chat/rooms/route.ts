import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";

const DEFAULT_ROOMS = [
  { name: "Санхүү III (Шалгалт)", topic: "Шалгалтын бэлтгэл" },
  { name: "Төгсөх ангийнхан", topic: "Диплом, төгсөлт" },
  { name: "Алдсан, олсон зүйлс", topic: "Зар, мэдээлэл" },
];

// GET /api/chat/rooms — нийтийн өрөөнүүд + миний DM-үүд (3 query)
export async function GET() {
  let me: { id: string; name?: string | null } | null = null;
  try {
    me = await requireUser();
  } catch { /* public */ }

  let rooms = await db.chatRoom.findMany({
    where: { matchId: null },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  if (rooms.length === 0) {
    const existing = await db.chatRoom.count();
    if (existing === 0) {
      await db.chatRoom.createMany({ data: DEFAULT_ROOMS });
      rooms = await db.chatRoom.findMany({
        where: { matchId: null },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
    }
  }

  // Миний match DM-үүд (нөгөө талын нэртэй)
  type DmRoom = { id: string; name: string; partnerName: string };
  let dms: DmRoom[] = [];
  if (me) {
    const matches = await db.match.findMany({
      where: { OR: [{ aId: me.id }, { bId: me.id }] },
      include: {
        a: { select: { id: true, name: true, nickname: true } },
        b: { select: { id: true, name: true, nickname: true } },
        chatRoom: { select: { id: true } },
      },
    });
    dms = matches
      .filter((m) => m.chatRoom)
      .map((m) => {
        const p = m.aId === me!.id ? m.b : m.a;
        const partnerName = p.nickname || p.name || "Хос";
        return { id: m.chatRoom!.id, name: partnerName, partnerName };
      });
  }

  const all = [
    ...rooms.map((r) => ({ id: r.id, name: r.name, topic: r.topic, dm: false as const })),
    ...dms.map((d) => ({ id: d.id, name: d.name, topic: "Хувийн чат", dm: true as const })),
  ];
  const ids = all.map((r) => r.id);
  const [recent, online] = await Promise.all([
    ids.length
      ? db.chatMessage.findMany({
          where: { roomId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: ids.length * 3,
          select: { roomId: true, text: true, userName: true, createdAt: true },
        })
      : Promise.resolve([]),
    ids.length
      ? db.chatMessage.groupBy({
          by: ["roomId", "userId"],
          where: { roomId: { in: ids }, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
        })
      : Promise.resolve([]),
  ]);
  const lastByRoom = new Map<string, { text: string; userName: string; createdAt: Date }>();
  for (const m of recent) {
    if (!lastByRoom.has(m.roomId)) {
      lastByRoom.set(m.roomId, { text: m.text, userName: m.userName, createdAt: m.createdAt });
    }
  }
  const onlineByRoom = new Map<string, number>();
  for (const o of online) {
    onlineByRoom.set(o.roomId, (onlineByRoom.get(o.roomId) ?? 0) + 1);
  }
  return NextResponse.json(
    {
      rooms: all.map((r) => ({
        id: r.id,
        name: r.name,
        topic: r.topic,
        dm: r.dm,
        online: onlineByRoom.get(r.id) ?? 0,
        last: lastByRoom.get(r.id) ?? null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
