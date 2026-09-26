import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

function dayStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function duration(bedMin: number, wakeMin: number) {
  return (wakeMin - bedMin + 1440) % 1440 || 480;
}

// GET /api/sleep — сүүлийн 14 хоног + streak
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const rows = await db.sleepLog.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
    take: 14,
  });
  // streak: өнөөдөр/өчигдрөөс эхлэн дараалсан өдрүүд
  const dates = new Set(rows.map((r) => r.date));
  let streak = 0;
  const d = new Date();
  if (!dates.has(dayStr(d))) d.setDate(d.getDate() - 1);
  while (dates.has(dayStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return NextResponse.json({
    logs: rows.map((r) => ({
      date: r.date,
      bedMin: r.bedMin,
      wakeMin: r.wakeMin,
      quality: r.quality,
      hours: Math.round((duration(r.bedMin, r.wakeMin) / 60) * 10) / 10,
    })),
    streak,
    today: dayStr(new Date()),
  });
}

// POST /api/sleep { date, bedMin, wakeMin, quality } — upsert
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { date, bedMin, wakeMin, quality } = await req.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    return NextResponse.json({ error: "Огноо буруу" }, { status: 400 });
  }
  const b = Math.floor(Number(bedMin));
  const w = Math.floor(Number(wakeMin));
  if (!Number.isFinite(b) || !Number.isFinite(w) || b < 0 || b >= 1440 || w < 0 || w >= 1440) {
    return NextResponse.json({ error: "Цаг буруу" }, { status: 400 });
  }
  const q = Math.min(5, Math.max(1, Math.floor(Number(quality) || 3)));
  const row = await db.sleepLog.upsert({
    where: { userId_date: { userId: me.id, date } },
    update: { bedMin: b, wakeMin: w, quality: q },
    create: { userId: me.id, date, bedMin: b, wakeMin: w, quality: q },
  });
  return NextResponse.json({
    ok: true,
    log: { date: row.date, hours: Math.round((duration(b, w) / 60) * 10) / 10 },
  });
}
