const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const dir = "C:\\Users\\asus\\Desktop\\номууд";
(async () => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    try {
      const d = await pdf(fs.readFileSync(p));
      const t = (d.text || "").replace(/\s+/g, " ").trim();
      console.log("FILE:", f);
      console.log("  pages:", d.numpages, "| chars:", t.length);
      console.log("  sample:", t.slice(0, 200));
    } catch (e) {
      console.log("FILE:", f, "ERROR:", e.message);
    }
  }
})();
