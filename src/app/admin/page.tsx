"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { BookStatus, STATUS_LABEL, Category, Condition } from "@/lib/types";

type Tab = "books" | "add" | "payments" | "ai" | "ads";

interface PendingItem { id: string; title: string; author: string; ownerName: string; createdAt: string; }
interface PendingAd { id: string; title: string; price: number; description: string; contact: string; owner: string; image: string | null; createdAt: string; }
interface PayRow {
  id: string; bookTitle: string; buyer: string; amount: number; creditSpent: number;
  status: string; method: string; qpayInvoiceId: string | null; qpayPaymentId: string | null;
  ebarimtId: string | null; orderId: string | null; createdAt: string;
}

export default function AdminPage() {
  const { books, adminSetStatus, notify, refreshAll } = useStore();
  const [tab, setTab] = useState<Tab>("books");
  const [counts, setCounts] = useState({ total: 0, active: 0, pending: 0, sold: 0, users: 0 });
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<PayRow[]>([]);
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [aiStats, setAiStats] = useState<{ total: number; byBook: { bookId: string; title: string; count: number }[] }>({ total: 0, byBook: [] });

  // add-book form
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<Category>("self_help");
  const [condition, setCondition] = useState<Condition>("good");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("5000");
  const [classCode, setClassCode] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");

  function load() {
    fetch("/api/admin/overview").then((r) => r.json()).then((d) => {
      if (d.counts) setCounts(d.counts);
      if (d.pending) setPending(d.pending);
    }).catch(() => {});
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => {
      if (d.payments) setPayments(d.payments);
    }).catch(() => {});
    fetch("/api/admin/ai-stats").then((r) => r.json()).then((d) => {
      if (typeof d.total === "number") setAiStats(d);
    }).catch(() => {});
    fetch("/api/admin/ads").then((r) => r.json()).then((d) => {
      if (d.ads) setPendingAds(d.ads);
    }).catch(() => {});
  }
  useEffect(load, [books]);

  function set(id: string, s: BookStatus) { adminSetStatus(id, s); }

  async function setAd(id: string, s: "active" | "rejected") {
    const r = await fetch(`/api/ads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (!r.ok) { notify("Алдаа", "err"); return; }
    notify(s === "active" ? "Зар зөвшөөрөгдлөө" : "Зараас татгалзлаа");
    load();
  }

  async function savePrice(id: string) {
    const v = Number(prices[id]);
    if (!Number.isFinite(v) || v < 0) { notify("Үнэ буруу байна", "err"); return; }
    const r = await fetch(`/api/books/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceCash: v }),
    });
    if (!r.ok) { notify("Хадгалах үед алдаа", "err"); return; }
    notify("Үнэ шинэчлэгдлээ ✓");
    refreshAll();
  }

  async function ebarimtRetry(paymentId: string) {
    const r = await fetch("/api/admin/ebarimt-retry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "Ebarimt алдаа", "err"); return; }
    notify("E-barimt үүслээ ✓");
    load();
  }

  async function confirmPay(paymentId: string) {
    if (!confirm("Шилжүүлэг орсныг баталгаажуулах уу? Ном нээгдэнэ.")) return;
    const r = await fetch("/api/admin/payments/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "Алдаа", "err"); return; }
    notify("Баталгаажлаа, ном нээгдлээ ✓");
    load();
    refreshAll();
  }

  async function cancelPay(paymentId: string) {
    if (!confirm("Төлбөрийг цуцлах уу?")) return;
    const r = await fetch("/api/admin/payments/cancel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "Алдаа", "err"); return; }
    notify("Цуцлагдлаа");
    load();
  }

  async function uploadCover(f: File | null) {
    if (!f) return;
    const form = new FormData();
    form.append("file", f);
    const r = await fetch("/api/uploads", { method: "POST", body: form });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Ковер upload алдаа");
    setCoverUrl(d.url);
    notify("Ковер upload хийгдлээ ✓");
  }

  async function submitBook() {
    if (!title.trim() || !author.trim() || !pdfFile) { notify("Нэр + зохиолч + PDF шаардлагатай", "err"); return; }
    setBusy(true);
    try {
      // 1. signed URL
      setStep("Upload бэлдэж байна...");
      const u = await fetch("/api/admin/upload-url", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ext: "pdf" }),
      }).then((r) => r.json());
      if (!u.url) throw new Error(u.error || "Upload URL алдаа");
      // 2. PDF → storage (browser → Supabase шууд)
      setStep("PDF upload хийж байна...");
      const put = await fetch(u.url, { method: "PUT", body: pdfFile, headers: { "Content-Type": "application/pdf" } });
      if (!put.ok) throw new Error("PDF upload амжилтгүй");
      // 3. текст задлал (browser)
      setStep("Текст задалж байна...");
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const buf = await pdfFile.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = await (pdfjs as any).getDocument({ data: new Uint8Array(buf), useWorkerFetch: false, isEvalSupported: false }).promise;
      const chunks: { pageNo: number; content: string }[] = [];
      for (let p = 1; p <= doc.numPages; p++) {
        setStep(`Текст задалж байна... ${p}/${doc.numPages}`);
        const page = await doc.getPage(p);
        const t = page.getTextContent().then((tc: { items: { str: string }[] }) =>
          tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim());
        const text = await t;
        if (text.length < 50) continue;
        let s = text;
        while (s.length > 1200) {
          let cut = s.lastIndexOf(".", 1200);
          if (cut < 480) cut = 1200;
          chunks.push({ pageNo: p, content: s.slice(0, cut + 1).trim() });
          s = s.slice(Math.max(0, cut + 1 - 150)).trim();
          if (!s) break;
        }
        if (s) chunks.push({ pageNo: p, content: s });
      }
      // 4. meta + chunks → server
      setStep("Хадгалж байна...");
      const r = await fetch("/api/admin/books", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), author: author.trim(), category, condition,
          description: description.trim(), priceCash: Number(price) || 5000,
          classificationCode: classCode.trim() || null, pdfPath: u.path,
          pages: doc.numPages, coverUrl: coverUrl || null,
          chunks: chunks.filter((c) => c.content.length >= 50),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Хадгалах үед алдаа");
      notify(`Ном нэмэгдлээ ✓ (${d.chunks} chunk)`);
      setTitle(""); setAuthor(""); setDescription(""); setPrice("5000"); setClassCode("");
      setPdfFile(null); setCoverUrl("");
      refreshAll();
      setTab("books");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Админ консол</h1>

      <div className="mt-4 flex gap-2 text-sm font-bold flex-wrap">
        {([["books", "Номууд"], ["ads", "Зарууд"], ["add", "Ном нэмэх"], ["payments", "Төлбөрүүд"], ["ai", "AI"]] as [Tab, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`rounded-full px-4 py-2 border ${tab === v ? "bg-navy text-white border-navy" : "bg-white border-slate-300"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "books" && (
        <div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
            {([["Нийт ном", counts.total], ["Идэвхтэй", counts.active], ["Шалгагдаж буй", counts.pending], ["Зарагдсан", counts.sold], ["Хэрэглэгч", counts.users]] as [string, number][]).map(([l, v]) => (
              <div key={l} className="rounded-2xl border bg-white p-4 text-center">
                <div className="text-2xl font-extrabold text-navy">{v}</div>
                <div className="text-xs text-slate-500 font-bold">{l}</div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-extrabold text-navy">Шалгагдаж байгаа ({pending.length})</h2>
          {pending.length === 0 && (
            <div className="mt-3 rounded-2xl bg-sage-light border border-emerald-200 p-5 text-sm text-emerald-800">
              ✓ Бүх постыг шалгасан байна.
            </div>
          )}
          <div className="mt-3 space-y-3">
            {pending.map((b) => (
              <div key={b.id} className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <div className="font-extrabold">{b.title}</div>
                  <div className="text-xs text-slate-500">{b.author} • {b.ownerName} • {String(b.createdAt).slice(0, 10)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => set(b.id, "active")} className="rounded-lg bg-sage px-4 py-2 text-sm font-bold text-white">✓ Зөвшөөрөх</button>
                  <button onClick={() => set(b.id, "rejected")} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-600">✕ Татгалзах</button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-extrabold text-navy">Бүх ном (үнэ тохируулах)</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b">
                  <th className="p-3">Ном</th>
                  <th className="p-3">Үнэ₮</th>
                  <th className="p-3">Төлөв</th>
                  <th className="p-3">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="p-3 font-bold">{b.title}
                      <div className="text-xs font-normal text-slate-400">{b.author} {b.hasAi ? "AI" : ""} {b.hasPdf ? "PDF" : ""}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <input defaultValue={b.priceCash} onChange={(e) => setPrices((p) => ({ ...p, [b.id]: e.target.value }))}
                          className="w-24 rounded border px-2 py-1 text-sm" inputMode="numeric" />
                        <button onClick={() => savePrice(b.id)} className="rounded bg-navy-light px-2 py-1 text-xs font-bold text-navy">💾</button>
                      </div>
                    </td>
                    <td className="p-3">{STATUS_LABEL[b.status]}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => set(b.id, "active")} className="rounded bg-sage-light px-2.5 py-1 text-xs font-bold text-emerald-700">Active</button>
                        <button onClick={() => set(b.id, "sold")} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold">Sold</button>
                        <button onClick={() => set(b.id, "rejected")} className="rounded bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "ads" && (
        <div>
          <h2 className="mt-5 text-xl font-extrabold text-navy">Шалгагдаж байгаа зарууд ({pendingAds.length})</h2>
          {pendingAds.length === 0 && (
            <div className="mt-3 rounded-2xl bg-sage-light border border-emerald-200 p-5 text-sm text-emerald-800">
              Бүх зарыг шалгасан байна.
            </div>
          )}
          <div className="mt-3 space-y-3">
            {pendingAds.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row md:items-center gap-3">
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt="" className="h-16 w-16 rounded-lg object-cover border" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-slate-100 grid place-items-center text-xs font-bold text-slate-400">Зар</div>
                )}
                <div className="flex-1">
                  <div className="font-extrabold">{a.title} • {Number(a.price).toLocaleString()}₮</div>
                  <div className="text-xs text-slate-500">{a.owner} • {a.contact} • {String(a.createdAt).slice(0, 10)}</div>
                  {a.description && <div className="mt-1 text-xs text-slate-600">{a.description}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAd(a.id, "active")} className="rounded-lg bg-sage px-4 py-2 text-sm font-bold text-white">Зөвшөөрөх</button>
                  <button onClick={() => setAd(a.id, "rejected")} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-600">Татгалзах</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "add" && (
        <div className="mt-5 max-w-3xl rounded-3xl border bg-white p-5 md:p-7 space-y-4">
          <h2 className="text-xl font-extrabold text-navy">Ebook нэмэх (PDF + AI)</h2>
          <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-paper p-6 text-center cursor-pointer hover:border-accent"
            onClick={() => document.getElementById("admin-pdf")?.click()}>
            <input id="admin-pdf" type="file" accept="application/pdf" className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
            <div className="font-bold">{pdfFile ? `${pdfFile.name} (${(pdfFile.size / 1048576).toFixed(1)}MB)` : "PDF сонгох"}</div>
            <div className="text-xs text-slate-500">Текст нь browser дээр задалж chunk хийнэ</div>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm font-bold">Нэр *
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal outline-none focus:border-accent" />
            </label>
            <label className="block text-sm font-bold">Зохиолч *
              <input value={author} onChange={(e) => setAuthor(e.target.value)}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal outline-none focus:border-accent" />
            </label>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="block text-sm font-bold">Ангилал
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal bg-white">
                <option value="children">Хүүхдийн</option>
                <option value="fiction">Уран зохиол</option>
                <option value="textbook">Сурах бичиг</option>
                <option value="self_help">Хувь хүний хөгжил</option>
                <option value="biography">Намтар</option>
              </select>
            </label>
            <label className="block text-sm font-bold">Төлөв
              <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal bg-white">
                <option value="new">Шинэ</option>
                <option value="like_new">Шинэвтэр</option>
                <option value="good">Дунд</option>
                <option value="used">Ашигласан</option>
              </select>
            </label>
            <label className="block text-sm font-bold">Үнэ ₮
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric"
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal outline-none focus:border-accent" />
            </label>
          </div>
          <label className="block text-sm font-bold">Тайлбар
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal outline-none focus:border-accent" />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm font-bold">Classification code (ebarimt)
              <input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="ж: 621000"
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal outline-none focus:border-accent" />
            </label>
            <label className="block text-sm font-bold">Ковер зураг
              <input type="file" accept="image/*"
                onChange={(e) => uploadCover(e.target.files?.[0] ?? null)}
                className="mt-1.5 w-full text-sm" />
              {coverUrl && <span className="text-xs text-sage font-bold">✓ Ковер бэлэн</span>}
            </label>
          </div>
          <button onClick={submitBook} disabled={busy}
            className="w-full rounded-xl bg-navy px-5 py-3.5 font-extrabold text-white hover:bg-navy-dark disabled:opacity-50">
            {busy ? step || "Боловсруулж байна..." : "🚀 Ном нэмэх + AI бэлдэх"}
          </button>
        </div>
      )}

      {tab === "payments" && (
        <div className="mt-5 rounded-2xl border bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b">
                <th className="p-3">Ном / Худалдан авагч</th>
                <th className="p-3">Дүн</th>
                <th className="p-3">Төлөв</th>
                <th className="p-3">E-barimt</th>
                <th className="p-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td className="p-5 text-center text-slate-400" colSpan={5}>Төлбөр байхгүй байна.</td></tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-bold">{p.bookTitle}
                    <div className="text-xs font-normal text-slate-400">
                      {p.buyer} • {p.method === "TRANSFER" ? "Шилжүүлэг" : "QPay"}
                    </div>
                  </td>
                  <td className="p-3">{p.amount.toLocaleString()}₮ + {p.creditSpent}кр</td>
                  <td className="p-3 font-bold">{p.status}</td>
                  <td className="p-3 text-xs">{p.ebarimtId ? `✓ ${p.ebarimtId.slice(0, 8)}` : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.status === "PENDING" && p.method === "TRANSFER" && (
                        <button onClick={() => confirmPay(p.id)} className="rounded bg-sage px-2.5 py-1 text-xs font-bold text-white">
                          ✓ Баталгаажуулах
                        </button>
                      )}
                      {p.status === "PENDING" && (
                        <button onClick={() => cancelPay(p.id)} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold">
                          Цуцлах
                        </button>
                      )}
                      {p.status === "PAID" && !p.ebarimtId && p.qpayPaymentId && (
                        <button onClick={() => ebarimtRetry(p.id)} className="rounded bg-accent-light px-2.5 py-1 text-xs font-bold text-accent-dark">
                          Ebarimt дахин
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ai" && (
        <div className="mt-5 rounded-3xl border bg-white p-5">
          <h2 className="font-extrabold text-navy">AI хэрэглээ (нийт {aiStats.total})</h2>
          <div className="mt-3 space-y-2">
            {aiStats.byBook.length === 0 && <div className="text-sm text-slate-500">Асуулт байхгүй байна.</div>}
            {aiStats.byBook.map((b) => (
              <div key={b.bookId} className="flex justify-between rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
                <span className="font-bold">{b.title}</span>
                <span className="font-extrabold text-accent-dark">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
