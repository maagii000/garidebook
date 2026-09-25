import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { MEMBERSHIP_PRICES, type MembershipPlan } from "@/lib/payments";

const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

async function current(userId: string) {
  return db.membership.findFirst({
    where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
  });
}

// GET /api/membership — идэвхтэй эрх + анхны хэрэглэгч эсэх
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const [active, ever] = await Promise.all([
    current(me.id),
    db.membership.findFirst({ where: { userId: me.id }, select: { id: true } }),
  ]);
  return NextResponse.json({
    membership: active
      ? { id: active.id, plan: active.plan, endsAt: active.endsAt, freeTrial: active.freeTrial }
      : null,
    firstTimer: !ever,
    prices: MEMBERSHIP_PRICES,
  });
}

// POST /api/membership { plan, trial? } | { plan, paymentId }
// trial: анхны хэрэглэгч — 30 хоног үнэгүй
// paymentId: MEMBERSHIP PAID төлбөрөөр эрх сунгах/авах (30 хоног)
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { plan, trial, paymentId } = await req.json();
  if (plan !== "BASE" && plan !== "PRO") {
    return NextResponse.json({ error: "Багц буруу" }, { status: 400 });
  }

  if (trial) {
    const ever = await db.membership.findFirst({ where: { userId: me.id }, select: { id: true } });
    if (ever) return NextResponse.json({ error: "Үнэгүй сар нэг удаа" }, { status: 400 });
    const m = await db.membership.create({
      data: {
        userId: me.id,
        plan: plan as MembershipPlan,
        freeTrial: true,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + THIRTY_DAYS),
      },
    });
    return NextResponse.json({ ok: true, membership: { plan: m.plan, endsAt: m.endsAt } });
  }

  const pay = await db.payment.findUnique({ where: { id: paymentId } });
  const expected = MEMBERSHIP_PRICES[plan as MembershipPlan];
  if (
    !pay || pay.buyerId !== me.id || pay.purpose !== "MEMBERSHIP" ||
    pay.status !== "PAID" || pay.amount < expected
  ) {
    return NextResponse.json({ error: "Эхлээд төлбөр төлнө үү" }, { status: 402 });
  }

  const base = (await current(me.id))?.endsAt ?? new Date();
  const start = base > new Date() ? base : new Date();
  const m = await db.membership.create({
    data: {
      userId: me.id,
      plan: plan as MembershipPlan,
      paymentId: pay.id,
      startsAt: start,
      endsAt: new Date(start.getTime() + THIRTY_DAYS),
    },
  });
  await db.payment.update({ where: { id: pay.id }, data: { refId: m.id } });
  return NextResponse.json({ ok: true, membership: { plan: m.plan, endsAt: m.endsAt } });
}
