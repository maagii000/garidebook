import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized, forbidden } from "@/lib/api-auth";
import { retrieveChunks } from "@/lib/retrieval";
import { deepseekAsk } from "@/lib/deepseek";

const DAILY_LIMIT = 30;

const SYSTEM = `Чи Garidebook-ийн номын туслах. Хэрэглэгчийн асуултад ЗӨВХӨН доорх номын хэсгүүдэд үндэслэн монголоор хариул.
- Хэсгүүдэд байхгүй мэдээллийг бүү зохио; мэдэхгүй бол "Энэ номын өгөгдсөн хэсгүүдэд тийм мэдээлэл алга" гэж хэл.
- Хариултын төгсгөлд ашигласан хуудасны дугаарыг (Хуудас N) гэж эш тат.
- Товч, тодорхой, 5 өгүүлбэрээс хэтрэхгүй байхыг хичээ.`;

// POST /api/ai/ask { bookId, question }
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId, question } = await req.json();
  const q = (question || "").trim();
  if (!bookId || !q) return NextResponse.json({ error: "Асуултаа бичнэ үү" }, { status: 400 });
  if (q.length > 500) return NextResponse.json({ error: "Асуулт хэт урт байна" }, { status: 400 });

  const book = await db.book.findUnique({ where: { id: bookId }, select: { id: true, title: true, textReady: true, pdfPath: true } });
  if (!book?.pdfPath || !book.textReady) return NextResponse.json({ error: "Энэ номонд AI байхгүй" }, { status: 400 });

  const isAdmin = me.role === "ADMIN";
  const owned = isAdmin || !!(await db.order.findFirst({
    where: { bookId, buyerId: me.id, status: "placed" }, select: { id: true },
  }));
  if (!owned) return forbidden("Эхлээд номоо худалдаж аваарай");

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const used = await db.aiQuery.count({ where: { userId: me.id, createdAt: { gte: dayStart } } });
  if (used >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Өдрийн AI лимит (30) дууссан. Маргааш дахин оролдоно уу." }, { status: 429 });
  }

  const chunks = await retrieveChunks(bookId, q, 5);
  const context = chunks.map((c, i) => `[Хэсэг ${i + 1} — хуудас ${c.pageNo ?? "?"}]\n${c.content.slice(0, 1400)}`).join("\n\n");

  try {
    const answer = await deepseekAsk(SYSTEM, `Ном: ${book.title}\n\n${context}\n\nАсуулт: ${q}`);
    await db.aiQuery.create({
      data: { bookId, userId: me.id, question: q, answer, chunksUsed: chunks.length },
    });
    return NextResponse.json({
      answer,
      pages: [...new Set(chunks.map((c) => c.pageNo).filter(Boolean))],
      remaining: DAILY_LIMIT - used - 1,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI алдаа" }, { status: 500 });
  }
}
