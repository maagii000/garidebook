import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_ROOMS = [
  { name: "Санхүү III (Шалгалт)", topic: "Шалгалтын бэлтгэл" },
  { name: "Төгсөх ангийнхан", topic: "Диплом, төгсөлт" },
  { name: "Алдсан, олсон зүйлс", topic: "Зар, мэдээлэл" },
];

// GET /api/chat/rooms — өрөөнүүд + сүүлийн мессеж (3 query, N+1 үгүй)
export async function GET() {
  let rooms = await db.chatRoom.findMany({ orderBy: { createdAt: "asc" }, take: 50 });
  if (rooms.length === 0) {
    await db.chatRoom.createMany({ data: DEFAULT_ROOMS });
    rooms = await db.chatRoom.findMany({ orderBy: { createdAt: "asc" }, take: 50 });
  }
  const ids = rooms.map((r) => r.id);
  const [recent, online] = await Promise.all([
    db.chatMessage.findMany({
      where: { roomId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: ids.length * 3,
      select: { roomId: true, text: true, userName: true, createdAt: true },
    }),
    db.chatMessage.groupBy({
      by: ["roomId", "userId"],
      where: { roomId: { in: ids }, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
    }),
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
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        topic: r.topic,
        online: onlineByRoom.get(r.id) ?? 0,
        last: lastByRoom.get(r.id) ?? null,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=120" } }
  );
}
