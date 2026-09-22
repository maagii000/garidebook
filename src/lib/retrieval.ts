import { db } from "./db";

const STOP = new Set([
  "the", "and", "for", "with", "this", "that", "from", "have", "were", "been", "are", "was",
  "гэж", "юм", "байна", "болон", "тэр", "энэ", "гэсэн", "байгаа", "хүн", "аав",
]);

export function termsOf(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-zа-яёөү0-9]+/iu)
    .filter((t) => t.length >= 3 && !STOP.has(t))
    .slice(0, 12);
}

// Keyword retrieval over book chunks (no embeddings needed).
export async function retrieveChunks(bookId: string, question: string, topK = 5) {
  const terms = termsOf(question);
  if (terms.length === 0) {
    return db.bookChunk.findMany({ where: { bookId }, orderBy: { chunkNo: "asc" }, take: topK });
  }
  const chunks = await db.bookChunk.findMany({ where: { bookId }, select: { id: true, chunkNo: true, pageNo: true, content: true } });
  const scored = chunks.map((c) => {
    const low = c.content.toLowerCase();
    let score = 0;
    for (const t of terms) {
      let i = low.indexOf(t);
      let n = 0;
      while (i >= 0 && n < 5) { score += t.length >= 5 ? 2 : 1; n++; i = low.indexOf(t, i + t.length); }
    }
    return { ...c, score };
  }).filter((c) => c.score > 0);
  scored.sort((a, b) => b.score - a.score || a.chunkNo - b.chunkNo);
  const top = scored.slice(0, topK);
  if (top.length === 0) {
    return chunks.slice(0, Math.min(topK, 2)).map((c) => ({ ...c, score: 0 }));
  }
  return top;
}
