// Live smoke test: public API + auth guards + canonical redirect + pages.
// Run: node scripts/smoke.mjs [baseUrl]
//   - canonical domain (blackup.ink): full checks
//   - alias domain (garidebook.world): expect 308 → canonical everywhere
// Exit 0 = all pass, 1 = failures.
const BASE = process.argv[2] || "https://blackup.ink";
const CANONICAL = "https://blackup.ink";
const isAlias = !BASE.startsWith(CANONICAL);

let pass = 0;
let fail = 0;
const failures = [];

async function check(name, fn) {
  try {
    const extra = await fn();
    pass++;
    console.log(`PASS  ${name}${extra ? " — " + extra : ""}`);
  } catch (e) {
    fail++;
    failures.push(name);
    console.log(`FAIL  ${name} — ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function get(path, opts = {}) {
  // Түр зуурын сүлжээ тасалдсанд 1 удаа дахин оролдоно
  let lastErr;
  for (let i = 0; i < 2; i++) {
    try {
      return await fetch(BASE + path, { redirect: "manual", ...opts });
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

async function jget(path) {
  const r = await get(path);
  assert(r.status === 200, `status ${r.status}`);
  return r.json();
}

// ---------- Alias mode: зөвхөн redirect шалгана ----------
if (isAlias) {
  const paths = ["/", "/hub", "/catalog", "/api/books", "/api/chat/rooms", "/login"];
  for (const p of paths) {
    await check(`ALIAS ${p} → 308 canonical`, async () => {
      const r = await get(p);
      assert([308, 307].includes(r.status), `status ${r.status}`);
      const loc = r.headers.get("location") || "";
      assert(loc.startsWith(CANONICAL + (p === "/" ? "/" : p)), `location=${loc}`);
      return loc;
    });
  }
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  if (failures.length) console.log("Failed:", failures.join(", "));
  process.exit(fail ? 1 : 0);
}

// ---------- Public pages ----------
await check("GET / → 200", async () => {
  const r = await get("/");
  assert(r.status === 200, `status ${r.status}`);
});

for (const p of ["/hub", "/membership", "/ads", "/catalog", "/login"]) {
  await check(`GET ${p}`, async () => {
    const r = await get(p);
    assert(r.status === 200, `status ${r.status}`);
    return "";
  });
}

for (const p of ["/chat", "/match", "/profile", "/ads/new", "/hub/new", "/admin"]) {
  await check(`GET ${p} → login redirect`, async () => {
    const r = await get(p);
    assert([307, 308].includes(r.status), `status ${r.status}`);
    const loc = r.headers.get("location") || "";
    assert(loc.includes("/login"), `location=${loc}`);
    return "redirect ok";
  });
}

for (const [p, dest] of [["/books/new", "/catalog"], ["/my-books", "/profile"]]) {
  await check(`GET ${p} → redirect ${dest}`, async () => {
    const r = await get(p);
    assert([307, 308].includes(r.status), `status ${r.status}`);
    const loc = r.headers.get("location") || "";
    assert(loc.includes(dest), `location=${loc}`);
    return "gone ok";
  });
}

await check("GET /api/credits/me → 404 removed", async () => {
  const r = await get("/api/credits/me");
  assert(r.status === 404, `status ${r.status}`);
});

await check("POST /api/books → 405 no user upload", async () => {
  const r = await get("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert([404, 405].includes(r.status), `status ${r.status}`);
});

// ---------- Public APIs ----------
await check("GET /api/books", async () => {
  const d = await jget("/api/books");
  assert(Array.isArray(d.books), "no books array");
  const noCover = d.books.filter((b) => !(b.images?.length || b.coverUrl));
  return `${d.books.length} books, coverless=${noCover.length}`;
});

await check("GET /api/hub", async () => {
  const d = await jget("/api/hub");
  assert(Array.isArray(d.materials), "no materials array");
  return `${d.materials.length} materials`;
});

await check("GET /api/hub?subjects=1", async () => {
  const d = await jget("/api/hub?subjects=1");
  assert(Array.isArray(d.subjects), "no subjects array");
  return `subjects=${d.subjects.length}`;
});

await check("GET /api/ads", async () => {
  const d = await jget("/api/ads");
  assert(Array.isArray(d.ads), "no ads array");
  return `${d.ads.length} ads`;
});

await check("GET /api/reviews", async () => {
  const d = await jget("/api/reviews?take=3");
  assert(Array.isArray(d.reviews), "no reviews array");
  return `${d.reviews.length} reviews`;
});

await check("GET /api/chat/rooms", async () => {
  const d = await jget("/api/chat/rooms");
  assert(Array.isArray(d.rooms) && d.rooms.length >= 1, "no rooms");
  return `${d.rooms.length} rooms`;
});

await check("GET /api/books/[id] valid", async () => {
  const all = await jget("/api/books");
  assert(all.books.length > 0, "no books to test detail");
  const one = await jget(`/api/books/${all.books[0].id}`);
  assert(one.book?.id, "no book detail");
  return one.book.title.slice(0, 30);
});

await check("GET /api/books/[id] 404", async () => {
  const r = await get("/api/books/does-not-exist-123");
  assert(r.status === 404, `status ${r.status}`);
});

// ---------- Auth guards (401/redirect, 500 биш) ----------
for (const p of ["/api/wishlist", "/api/orders", "/api/users/me", "/api/membership"]) {
  await check(`GET ${p} → 401`, async () => {
    const r = await get(p);
    assert(r.status === 401, `status ${r.status}`);
  });
}

for (const p of ["/api/admin/users", "/api/admin/users/xxx"]) {
  await check(`GET ${p} → 403 (admin only)`, async () => {
    const r = await get(p);
    assert([401, 403].includes(r.status), `status ${r.status}`);
  });
}

for (const [p, body] of [
  ["/api/payments", {}],
  ["/api/ads", {}],
  ["/api/hub", {}],
  ["/api/membership", {}],
  ["/api/match/feed", null],
  ["/api/match/list", null],
]) {
  await check(`${body ? "POST" : "GET"} ${p} → 401`, async () => {
    const r = body
      ? await get(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await get(p);
    assert(r.status === 401, `status ${r.status}`);
  });
}

await check("POST /api/chat msg → 401", async () => {
  const rooms = await jget("/api/chat/rooms");
  const r = await get(`/api/chat/rooms/${rooms.rooms[0].id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "hi" }),
  });
  assert(r.status === 401, `status ${r.status}`);
});

await check("POST /api/books/[id]/reviews → 401", async () => {
  const all = await jget("/api/books");
  const r = await get(`/api/books/${all.books[0].id}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5, text: "test" }),
  });
  assert(r.status === 401, `status ${r.status}`);
});

// ---------- Summary ----------
console.log(`\n==== ${pass} passed, ${fail} failed ====`);
if (failures.length) console.log("Failed:", failures.join(", "));
process.exit(fail ? 1 : 0);
