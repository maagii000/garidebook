import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { ageOf } from "@/lib/profile";

// GET /api/admin/users/[id] — хэрэглэгчийн дэлгэрэнгүй (зөвхөн админ)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { id } = await params;

  const u = await db.user.findUnique({
    where: { id },
    include: {
      memberships: {
        where: { status: "ACTIVE", endsAt: { gt: new Date() } },
        select: { plan: true, endsAt: true, freeTrial: true },
        take: 1,
      },
    },
  });
  if (!u) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  const [
    orderCount,
    orders,
    payments,
    materials,
    ads,
    reviews,
    matchCount,
    msgCount,
    streak,
  ] = await Promise.all([
    db.order.count({ where: { buyerId: id } }),
    db.order.findMany({
      where: { buyerId: id },
      include: { book: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.payment.findMany({
      where: { buyerId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amount: true, purpose: true, status: true, method: true, createdAt: true },
    }),
    db.material.findMany({
      where: { ownerId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, price: true, createdAt: true },
    }),
    db.ad.findMany({
      where: { ownerId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, price: true, createdAt: true },
    }),
    db.review.count({ where: { userId: id } }),
    db.match.count({ where: { OR: [{ aId: id }, { bId: id }] } }),
    db.chatMessage.count({ where: { userId: id } }),
    db.sleepLog.findMany({ where: { userId: id }, orderBy: { date: "desc" }, take: 30, select: { date: true } }),
  ]);

  let days = 0;
  const dates = new Set(streak.map((s) => s.date));
  const d = new Date();
  const dayStr = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (!dates.has(dayStr(d))) d.setDate(d.getDate() - 1);
  while (dates.has(dayStr(d))) {
    days++;
    d.setDate(d.getDate() - 1);
  }

  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      nickname: u.nickname,
      lastName: u.lastName,
      firstName: u.firstName,
      birthDate: u.birthDate,
      age: ageOf(u.birthDate ?? ""),
      school: u.school,
      bio: u.bio,
      interests: u.interests,
      lookingFor: u.lookingFor,
      role: u.role,
      plan: u.memberships[0]?.plan ?? null,
      planEnds: u.memberships[0]?.endsAt ?? null,
      createdAt: u.createdAt,
    },
    stats: {
      orders: orderCount,
      reviews,
      matches: matchCount,
      messages: msgCount,
      sleepStreak: days,
      materials: materials.length,
      ads: ads.length,
    },
    orders: orders.map((o) => ({
      id: o.id,
      bookTitle: o.book.title,
      cashPaid: o.cashPaid,
      createdAt: o.createdAt,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      purpose: p.purpose,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
    })),
    materials: materials.map((m) => ({ id: m.id, title: m.title, status: m.status, price: m.price })),
    ads: ads.map((a) => ({ id: a.id, title: a.title, status: a.status, price: a.price })),
  });
}

// PATCH /api/admin/users/[id] { role } — роль солих (өөрийгөө бууруулж болохгүй)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const { id } = await params;
  const { role } = await req.json();
  if (role !== "USER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Роль буруу" }, { status: 400 });
  }
  if (id === admin.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Өөрийгөө админаас хасаж болохгүй" }, { status: 400 });
  }
  const updated = await db.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ ok: true, role: updated.role });
}
