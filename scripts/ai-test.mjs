import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const STOP = new Set(["the", "and", "for", "with", "this", "that", "from", "гэж", "юм", "байна", "болон", "тэр", "энэ", "гэсэн", "байгаа"]);
const question = process.argv[2] || "Баян аав ядуу ааваас юугаараа ялгаатай вэ?";
const bookId = "eb-richdad";

const terms = question.toLowerCase().split(/[^a-zа-яёөү0-9]+/iu).filter((t) => t.length >= 3 && !STOP.has(t)).slice(0, 12);
console.log("terms:", terms.join(", "));
const chunks = await prisma.bookChunk.findMany({ where: { bookId }, select: { chunkNo: true, pageNo: true, content: true } });
const scored = chunks.map((c) => {
  const low = c.content.toLowerCase();
  let s = 0;
  for (const t of terms) { let i = low.indexOf(t), n = 0; while (i >= 0 && n < 5) { s += t.length >= 5 ? 2 : 1; n++; i = low.indexOf(t, i + t.length); } }
  return { ...c, score: s };
}).filter((c) => c.score > 0).sort((a, b) => b.score - a.score || a.chunkNo - b.chunkNo).slice(0, 5);
console.log("top chunks:", scored.map((c) => `#${c.chunkNo}(p${c.pageNo},s${c.score})`).join(" "));

const ctx = scored.map((c, i) => `[Хэсэг ${i + 1} — хуудас ${c.pageNo}]\n${c.content.slice(0, 1400)}`).join("\n\n");
const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: "Bearer sk-9dbb2e8166f94830a97d607cdb3ea113", "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "deepseek-flash",
    messages: [
      { role: "system", content: "Чи номын туслах. Зөвхөн өгөгдсөн хэсгүүдээс монголоор товч хариул. Хуудас эш тат." },
      { role: "user", content: `${ctx}\n\nАсуулт: ${question}` },
    ],
    max_tokens: 2000, temperature: 0.3,
  }),
});
const d = await r.json();
const msg = d.choices?.[0]?.message;
console.log("--- ANSWER ---");
console.log((msg?.content?.trim() || msg?.reasoning_content?.trim() || JSON.stringify(d).slice(0, 300)));
await prisma.$disconnect();
