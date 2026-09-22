// Ingest real ebooks: upload PDF → extract text → chunk → replace mock seed books.
// Run: node scripts/ingest-books.mjs
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  try {
    const text = fs.readFileSync(path, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.replace(/\r$/, "");
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) {
        let v = m[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (!process.env[m[1]]) process.env[m[1]] = v;
      }
    }
  } catch { /* ignore */ }
}
loadEnv(".env.local");

const prisma = new PrismaClient();
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DIR = "C:\\Users\\asus\\Desktop\\номууд";
const BOOKS = [
  {
    id: "eb-richdad", file: "24009998-Баян-аав-Яадуу-аав.pdf",
    title: "Баян аав, Яадуу аав", author: "Роберт Кийосаки",
    category: "self_help", condition: "like_new",
    description: "Мөнгөний боловсролын сонгодог номын монгол орчуулга. Баян аав, ядуу аавын мөнгөний сэтгэлгээний ялгаа.",
  },
  {
    id: "eb-health12", file: "12_eruul_mend.pdf",
    title: "Эрүүл мэнд 12", author: "БШУЯ сурах бичиг",
    category: "textbook", condition: "good",
    description: "Ерөнхий боловсролын 12 дугаар ангийн Эрүүл мэндийн сурах бичиг.",
  },
  {
    id: "eb-elon", file: "Elon Musk _Risk It All_ орчуулга.pdf",
    title: "Элон Маск: Бүхнийг эрсдэлд тавихуй", author: "Майкл Влисмасс",
    category: "biography", condition: "like_new",
    description: "Элон Маскийн амьдрал, SpaceX, Tesla, PayPal-ийн түүхийн монгол орчуулга.",
  },
  {
    id: "eb-gtd", file: "motivation - Getting Things Done - The Art of Stress-Free Productivity.pdf",
    title: "Getting Things Done", author: "Дэвид Аллен",
    category: "self_help", condition: "good",
    description: "Стрессгүй бүтээмжийн урлаг — цагийн менежментийн дэлхийн бестселлер (англи хэл дээр).",
  },
  {
    id: "eb-goggins", file: "_намайг гэмтээж чадахгүй_ - ДЭЙВИД ГОГГИНС. Cant Hurt Me - David Goggins.pdf",
    title: "Намайг гэмтээж чадахгүй", author: "Дэвид Гоггинс",
    category: "self_help", condition: "like_new",
    description: "Хүсэл зориг, тэсвэр хатуужлын тухай бестселлер номын монгол орчуулга.",
  },
  {
    id: "eb-procrast", file: "Залхуурах урлаг_ Overcome Procrastination & Improve Your Productivity.pdf",
    title: "Залхуурах урлаг", author: "Library Mindset",
    category: "self_help", condition: "good",
    description: "Хойшлуулдаг зуршлаа хэрхэн даван туулах тухай практик гарын авлага.",
  },
];

function chunkPage(text, max = 1200, overlap = 150) {
  const out = [];
  let s = text;
  while (s.length > max) {
    let cut = s.lastIndexOf(".", max);
    if (cut < max * 0.4) cut = s.lastIndexOf("\n", max);
    if (cut < max * 0.4) cut = max;
    out.push(s.slice(0, cut + 1).trim());
    s = s.slice(Math.max(0, cut + 1 - overlap)).trim();
    if (!s) break;
  }
  if (s) out.push(s);
  return out.filter((c) => c.length >= 50);
}

async function main() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const adminEmail = process.env.ADMIN_EMAIL;
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) throw new Error("Admin user not found: " + adminEmail);

  // Remove old mock seed books (cascade handles images/reviews/chunks/wishlist)
  const oldIds = ["g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12"];
  await prisma.order.deleteMany({ where: { bookId: { in: oldIds } } });
  await prisma.book.deleteMany({ where: { id: { in: oldIds } } });
  console.log("old mock books removed");

  for (const b of BOOKS) {
    const full = `${DIR}\\${b.file}`;
    const buf = fs.readFileSync(full);
    // 1. upload PDF to private bucket
    const path = `${b.id}.pdf`;
    const { error: upErr } = await sb.storage.from("ebooks").upload(path, buf, {
      contentType: "application/pdf", upsert: true,
    });
    if (upErr) throw new Error(`upload ${b.id}: ${upErr.message}`);
    // 2. extract text per page
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false, isEvalSupported: false }).promise;
    const pages = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const t = (await page.getTextContent()).items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
      if (t.length >= 50) pages.push({ pageNo: p, text: t });
    }
    // 3. chunk + insert
    await prisma.bookChunk.deleteMany({ where: { bookId: b.id } });
    await prisma.book.upsert({
      where: { id: b.id },
      update: {
        title: b.title, author: b.author, category: b.category, condition: b.condition,
        description: b.description, pdfPath: path, pages: doc.numPages, textReady: true,
      },
      create: {
        id: b.id, title: b.title, author: b.author, category: b.category, condition: b.condition,
        description: b.description, source: "official", status: "active", priceCash: 5000,
        ownerId: admin.id, pdfPath: path, pages: doc.numPages, textReady: true,
        avgRating: 0, reviewCount: 0,
      },
    });
    let n = 0;
    const rows = [];
    for (const pg of pages) {
      for (const c of chunkPage(pg.text)) rows.push({ bookId: b.id, chunkNo: n++, pageNo: pg.pageNo, content: c });
    }
    // insert in batches
    for (let i = 0; i < rows.length; i += 200) {
      await prisma.bookChunk.createMany({ data: rows.slice(i, i + 200) });
    }
    console.log(`${b.id}: pages=${doc.numPages} chunks=${n} (${(buf.length / 1048576).toFixed(1)}MB)`);
  }
}

main()
  .catch((e) => { console.error("FAIL:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
