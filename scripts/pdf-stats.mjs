// Full-text stats per PDF (read-only).
import fs from "node:fs";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const file = process.argv[2];
const buf = fs.readFileSync(file);
const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false, isEvalSupported: false }).promise;
let total = 0, empty = 0;
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const t = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
  total += t.length;
  if (t.length < 50) empty++;
}
console.log(JSON.stringify({ pages: doc.numPages, totalChars: total, emptyPages: empty }));
