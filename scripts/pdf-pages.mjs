import fs from "node:fs";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const buf = fs.readFileSync(process.argv[2]);
const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false, isEvalSupported: false }).promise;
for (const p of [2, 3, 4, 5]) {
  if (p > doc.numPages) break;
  const page = await doc.getPage(p);
  const t = (await page.getTextContent()).items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
  console.log(`--- p${p} (${t.length}):`, JSON.stringify(t.slice(0, 400)));
}
