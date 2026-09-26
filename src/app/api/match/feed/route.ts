import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

function pub(u: { id: string; name: string | null; nickname: string | null; school: string; interests: string; bio: string; image: string | null }) {
  return {
    id: u.id,
    name: u.nickname || u.name || "Оюутан",
    school: u.school || "",
    interests: u.interests || "",
    bio: u.bio || "",
    image: u.image,
  };
}

// GET /api/match/feed?mode=study|business — swipe хийгээгүй хэрэглэгчид (max 20)
export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const mode = req.nextUrl.searchParams.get("mode") === "business" ? "business" : "study";
  const swiped = await db.swipe.findMany({ where: { fromId: me.id }, select: { toId: true } });
  const exclude = new Set([me.id, ...swiped.map((s) => s.toId)]);
  const users = await db.user.findMany({
    where: { id: { notIn: [...exclude] }, lookingFor: mode },
    select: { id: true, name: true, nickname: true, school: true, interests: true, bio: true, image: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ feed: users.map(pub) });
}

// DELETE /api/match/feed — миний бүх swipe цэвэрлэх (Дахин эхлэх)
export async function DELETE() {
  const me = await requireUser();
  if (!me) return unauthorized();
  await db.swipe.deleteMany({ where: { fromId: me.id } });
  return NextResponse.json({ ok: true });
}
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { toId, dir } = await req.json();
  if (!toId || toId === me.id || !["left", "right"].includes(dir)) {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { id: toId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  await db.swipe.upsert({
    where: { fromId_toId: { fromId: me.id, toId } },
    update: { dir },
    create: { fromId: me.id, toId, dir },
  });

  let matched = false;
  let roomId: string | null = null;
  if (dir === "right") {
    const back = await db.swipe.findUnique({
      where: { fromId_toId: { fromId: toId, toId: me.id } },
    });
    if (back?.dir === "right") {
      const [aId, bId] = [me.id, toId].sort();
      const m = await db.match.upsert({
        where: { aId_bId: { aId, bId } },
        update: {},
        create: { aId, bId },
      });
      matched = true;
      // Хувийн чат өрөө нээх (idempotent)
      const room = await db.chatRoom.upsert({
        where: { matchId: m.id },
        update: {},
        create: {
          name: "Хувийн чат",
          topic: "Match",
          matchId: m.id,
        },
      });
      const hasMsg = await db.chatMessage.findFirst({ where: { roomId: room.id } });
      if (!hasMsg) {
        await db.chatMessage.create({
          data: {
            roomId: room.id,
            userId: me.id,
            userName: "Систем",
            text: "Та хоёр таарлаа! Энд чөлөөтэй чатлаарай.",
          },
        });
      }
      roomId = room.id;
    }
  }
  return NextResponse.json({ ok: true, matched, roomId });
}
