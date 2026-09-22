import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";

// GET /api/credits/me — { credit, txs }
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const txs = await db.creditTx.findMany({
    where: { userId: me.id },
    include: { book: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    credit: me.credit,
    txs: txs.map((t) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      bookTitle: t.book?.title,
      createdAt: t.createdAt,
    })),
  });
}
