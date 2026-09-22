// One-time setup: create public `book-images` bucket (service_role).
// Run: node scripts/setup-storage.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb.storage.createBucket("book-images", { public: true });
if (error && !error.message.includes("already exists")) {
  console.error("FAIL book-images:", error.message);
  process.exit(1);
}
console.log("bucket OK:", data?.name ?? "book-images (already existed)");

const eb = await sb.storage.createBucket("ebooks", { public: false });
if (eb.error && !eb.error.message.includes("already exists")) {
  console.error("FAIL ebooks:", eb.error.message);
  process.exit(1);
}
console.log("bucket OK:", eb.data?.name ?? "ebooks (already existed)");
