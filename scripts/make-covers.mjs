// Ebook PDF-үүдийн нүүр хуудсыг ковер зураг болгон render хийж,
// public book-images bucket руу upload хийн Book.coverUrl-д хадгална.
// Run: node scripts/make-covers.mjs  (needs: npm i --no-save @napi-rs/canvas)
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { createCanvas } from "@napi-rs/canvas";

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
  { id: "eb-richdad", file: "24009998-Баян-аав-Яадуу-аав.pdf" },
  { id: "eb-health12", file: "12_eruul_mend.pdf" },
  { id: "eb-elon", file: "Elon Musk _Risk It All_ орчуулга.pdf" },
  { id: "eb-gtd", file: "motivation - Getting Things Done - The Art of Stress-Free Productivity.pdf" },
  { id: "eb-goggins", file: "_намайг гэмтээж чадахгүй_ - ДЭЙВИД ГОГГИНС. Cant Hurt Me - David Goggins.pdf" },
  { id: "eb-procrast", file: "Залхуурах урлаг_ Overcome Procrastination & Improve Your Productivity.pdf" },
];

async function renderCover(pdfPath, targetW = 400) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buf = fs.readFileSync(pdfPath);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false, isEvalSupported: false }).promise;
  const page = await doc.getPage(1);
  const v1 = page.getViewport({ scale: 1 });
  const scale = targetW / v1.width;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.encode("png");
}

async function main() {
  for (const b of BOOKS) {
    const full = `${DIR}\\${b.file}`;
    if (!fs.existsSync(full)) {
      console.log(`${b.id}: FILE NOT FOUND, skip`);
      continue;
    }
    const png = await renderCover(full);
    const path = `covers/${b.id}.png`;
    const { error } = await sb.storage.from("book-images").upload(path, png, {
      contentType: "image/png", upsert: true,
    });
    if (error) throw new Error(`upload ${b.id}: ${error.message}`);
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-images/${path}`;
    await prisma.book.update({ where: { id: b.id }, data: { coverUrl: url } });
    console.log(`${b.id}: cover OK (${(png.length / 1024).toFixed(0)}KB) -> ${url}`);
  }
}

main()
  .catch((e) => { console.error("FAIL:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
