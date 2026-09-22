import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const books = await p.book.findMany({ select: { id: true, title: true, pages: true, status: true } });
for (const b of books) {
  const c = await p.bookChunk.count({ where: { bookId: b.id } });
  console.log(b.id, "|", b.title.slice(0, 32), "| pages:", b.pages, "| chunks:", c, "|", b.status);
}
await p.$disconnect();
