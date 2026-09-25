import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_ROOMS = [
  { name: "Санхүү III (Шалгалт)", topic: "Шалгалтын бэлтгэл" },
  { name: "Төгсөх ангийнхан", topic: "Диплом, төгсөлт" },
  { name: "Алдсан, олсон зүйлс", topic: "Зар, мэдээлэл" },
];

// GET /api/chat/rooms — өрөөнүүд + сүүлийн мессеж (байхгүй бол seed)
export async function GET() {
  let rooms = await db.chatRoom.findMany({ orderBy: { createdAt: "asc" }, take: 50 });
  if (rooms.length === 0) {
    await db.chatRoom.createMany({ data: DEFAULT_ROOMS });
    rooms = await db.chatRoom.findMany({ orderBy: { createdAt: "asc" }, take: 50 });
  }
  const out = await Promise.all(
    rooms.map(async (r) => {
      const last = await db.chatMessage.findFirst({
        where: { roomId: r.id },
        orderBy: { createdAt: "desc" },
        select: { text: true, userName: true, createdAt: true },
      });
      const online = await db.chatMessage.groupBy({
        by: ["userId"],
        where: { roomId: r.id, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
      });
      return {
        id: r.id,
        name: r.name,
        topic: r.topic,
        online: online.length,
        last: last ? { text: last.text, userName: last.userName, createdAt: last.createdAt } : null,
      };
    })
  );
  return NextResponse.json({ rooms: out });
}
