// Quick PDF text-layer probe (read-only).
import fs from "node:fs";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const file = process.argv[2];
const buf = fs.readFileSync(file);
const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false, isEvalSupported: false }).promise;
console.log("pages:", doc.numPages);
let total = 0;
const samples = [];
for (let p = 1; p <= Math.min(doc.numPages, 3); p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const t = tc.items.map((i) => i.str).join(" ");
  total += t.length;
  if (p === 1) samples.push(t.slice(0, 300));
}
console.log("chars(first 3 pages):", total);
console.log("sample:", JSON.stringify(samples[0]));
