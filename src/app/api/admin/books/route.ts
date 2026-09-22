import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, toBook, forbidden } from "@/lib/api-auth";

const bookInclude = { owner: { select: { name: true } }, images: { orderBy: { sort: "asc" as const } } };

// POST /api/admin/books — admin ebook үүсгэх (PDF аль хэдийн storage-д upload хийгдсэн)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const b = await req.json();
  const { title, author, category, condition, description, priceCash, classificationCode, pdfPath, pages, coverUrl, chunks } = b;
  if (!title?.trim() || !author?.trim() || !pdfPath) {
    return NextResponse.json({ error: "Нэр + зохиолч + PDF шаардлагатай" }, { status: 400 });
  }

  const book = await db.book.create({
    data: {
      title: title.trim(),
      author: author.trim(),
      category: category || "self_help",
      condition: condition || "good",
      description: (description || "").trim(),
      source: "official",
      status: "active",
      priceCash: Math.max(0, Number(priceCash) || 5000),
      ownerId: admin.id,
      pdfPath,
      pages: Number(pages) || null,
      coverUrl: coverUrl || null,
      classificationCode: classificationCode || null,
      textReady: Array.isArray(chunks) && chunks.length > 0,
    },
    include: bookInclude,
  });

  if (Array.isArray(chunks) && chunks.length > 0) {
    const rows = chunks
      .filter((c: { content?: string }) => c.content && c.content.length >= 50)
      .map((c: { pageNo?: number; content: string }, i: number) => ({
        bookId: book.id, chunkNo: i, pageNo: Number(c.pageNo) || null, content: c.content.slice(0, 4000),
      }));
    for (let i = 0; i < rows.length; i += 200) {
      await db.bookChunk.createMany({ data: rows.slice(i, i + 200) });
    }
  }

  return NextResponse.json({ book: toBook(book, false), chunks: Array.isArray(chunks) ? chunks.length : 0 });
}
