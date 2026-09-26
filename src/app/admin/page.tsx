"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { BookStatus, STATUS_LABEL, Category, Condition } from "@/lib/types";

type Tab = "books" | "add" | "payments" | "ai" | "ads" | "hub" | "users";

interface PendingItem { id: string; title: string; author: string; ownerName: string; createdAt: string; }
interface PendingAd { id: string; title: string; price: number; description: string; contact: string; owner: string; image: string | null; createdAt: string; }
interface PendingMaterial { id: string; title: string; subject: string; description: string; fileName: string; fileSize: number; price: number; owner: string; createdAt: string; }
interface AdminUser {
  id: string; name: string | null; email: string | null; nickname: string | null;
  lastName: string; firstName: string; birthDate: string; age: number | null;
  school: string; bio: string; interests: string; lookingFor: string;
  role: string; plan: string | null; planEnds: string | null; createdAt: string;
}
interface PayRow {
  id: string; bookTitle: string; purpose: string; refId: string | null; buyer: string; amount: number; creditSpent: number;
  status: string; method: string; qpayInvoiceId: string | null; qpayPaymentId: string | null;
  ebarimtId: string | null; orderId: string | null; createdAt: string;
}
interface PayDetail {
  payment: {
    id: string; ref: string; amount: number; creditSpent: number; purpose: string;
    status: string; method: string; qpayInvoiceId: string | null; qpayPaymentId: string | null;
    ebarimtId: string | null; createdAt: string; paidAt: string | null;
  };
  buyer: { id: string; name: string; email: string | null } | null;
  item: { kind: string; id: string | null; title: string };
  order: { id: string; cashPaid: number } | null;
}
interface UserDetail {
  user: {
    id: string; name: string | null; email: string | null; nickname: string | null;
    lastName: string; firstName: string; birthDate: string; age: number | null;
    school: string; bio: string; interests: string; lookingFor: string;
    role: string; plan: string | null; planEnds: string | null; createdAt: string;
  };
  stats: { orders: number; reviews: number; matches: number; messages: number; sleepStreak: number; materials: number; ads: number };
  orders: { id: string; bookTitle: string; cashPaid: number; createdAt: string }[];
  payments: { id: string; amount: number; purpose: string; status: string; method: string; createdAt: string }[];
  materials: { id: string; title: string; status: string; price: number }[];
  ads: { id: string; title: string; status: string; price: number }[];
}

export default function AdminPage() {
  const { books, adminSetStatus, notify, refreshAll } = useStore();
  const [tab, setTab] = useState<Tab>("books");
  const [counts, setCounts] = useState({ total: 0, active: 0, pending: 0, sold: 0, users: 0 });
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<PayRow[]>([]);
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userQ, setUserQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
    fetch("/api/admin/materials").then((r) => r.json()).then((d) => {
      if (d.materials) setPendingMaterials(d.materials);
    }).catch(() => {});
    fetch("/api/admin/users").then((r) => r.json()).then((d) => {
      if (d.users) setUsers(d.users);
    }).catch(() => {});
  }
  useEffect(load, [books]);

  function set(id: string, s: BookStatus) { adminSetStatus(id, s); }

  function openUser(id: string) {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setDetail(d);
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  }

  function closeUser() {
    setDetailId(null);
    setDetail(null);
  }

  async function setUserRole(id: string, role: "USER" | "ADMIN") {
    if (!confirm(role === "ADMIN" ? "Админ эрх олгох уу?" : "Админ эрхийг хасах уу?")) return;
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "Алдаа", "err"); return; }
    notify(role === "ADMIN" ? "Админ болголоо" : "Хэрэглэгч болголоо");
    setDetail((p) => (p ? { ...p, user: { ...p.user, role } } : p));
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  async function setAd(id: string, s: "active" | "rejected") {    const r = await fetch(`/api/ads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (!r.ok) { notify("Алдаа", "err"); return; }
    notify(s === "active" ? "Зар зөвшөөрөгдлөө" : "Зараас татгалзлаа");
    load();
  }

  async function setMaterial(id: string, s: "active" | "rejected") {
    const r = await fetch(`/api/hub/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (!r.ok) { notify("Алдаа", "err"); return; }
    notify(s === "active" ? "Материал зөвшөөрөгдлөө" : "Материалаас татгалзлаа");
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

  async function syncPay(paymentId: string) {
    const r = await fetch("/api/admin/payments/sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "QPay шалгах үед алдаа", "err"); return; }
    notify(d.status === "PAID" ? "Төлбөр орсон — баталгаажлаа ✓" : "Төлбөр хараахан ороогүй байна");
    load();
    refreshAll();
  }

  async function confirmPay(paymentId: string, method: string) {
    if (!confirm(method === "TRANSFER"
      ? "Шилжүүлэг орсныг баталгаажуулах уу? Холбоотой үйлчилгээ шууд идэвхжинэ."
      : "QPay төлбөрийг гараар баталгаажуулах уу? Холбоотой үйлчилгээ шууд идэвхжинэ.")) return;
    const r = await fetch("/api/admin/payments/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "Баталгаажуулах үед алдаа", "err"); return; }
    notify("Баталгаажлаа — үйлчилгээ идэвхжлээ ✓");
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
    if (payDetailId) openPay(payDetailId);
  }

  // Төлбөрийн drawer
  const [payDetailId, setPayDetailId] = useState<string | null>(null);  const [payDetail, setPayDetail] = useState<PayDetail | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  function openPay(id: string) {
    setPayDetailId(id);
    setPayDetail(null);
    setPayLoading(true);
    fetch(`/api/admin/payments/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.payment) setPayDetail(d);
        setPayLoading(false);
      })
      .catch(() => setPayLoading(false));
  }

  function closePay() {
    setPayDetailId(null);
    setPayDetail(null);
  }

  function copyText(t: string) {
    navigator.clipboard?.writeText(t).then(
      () => notify("Хууллаа ✓"),
      () => notify("Хуулах үед алдаа", "err")
    );
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
        {([["books", "Номууд"], ["ads", "Зарууд"], ["hub", "Материал"], ["users", "Хэрэглэгчид"], ["add", "Ном нэмэх"], ["payments", "Төлбөрүүд"], ["ai", "AI"]] as [Tab, string][]).map(([v, l]) => (
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

      {tab === "hub" && (
        <div>
          <h2 className="mt-5 text-xl font-extrabold text-navy">Шалгагдаж байгаа материалууд ({pendingMaterials.length})</h2>
          {pendingMaterials.length === 0 && (
            <div className="mt-3 rounded-2xl bg-sage-light border border-emerald-200 p-5 text-sm text-emerald-800">
              Бүх материалыг шалгасан байна.
            </div>
          )}
          <div className="mt-3 space-y-3">
            {pendingMaterials.map((m) => (
              <div key={m.id} className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <div className="font-extrabold">{m.title}</div>
                  <div className="text-xs text-slate-500">
                    {m.subject} • {m.fileName} • {m.price > 0 ? `${Number(m.price).toLocaleString()}₮` : "Үнэгүй"} • {m.owner} • {String(m.createdAt).slice(0, 10)}
                  </div>
                  {m.description && <div className="mt-1 text-xs text-slate-600">{m.description}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMaterial(m.id, "active")} className="rounded-lg bg-sage px-4 py-2 text-sm font-bold text-white">Зөвшөөрөх</button>
                  <button onClick={() => setMaterial(m.id, "rejected")} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-600">Татгалзах</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div>
          <h2 className="mt-5 text-xl font-extrabold text-navy">Хэрэглэгчид ({users.length})</h2>
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2.5 max-w-md">
            <input
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetch(`/api/admin/users?q=${encodeURIComponent(userQ.trim())}`)
                    .then((r) => r.json())
                    .then((d) => { if (d.users) setUsers(d.users); })
                    .catch(() => {});
                }
              }}
              placeholder="Нэр, имэйл, nickname-ээр хайх... (Enter)"
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              onClick={() => {
                fetch(`/api/admin/users?q=${encodeURIComponent(userQ.trim())}`)
                  .then((r) => r.json())
                  .then((d) => { if (d.users) setUsers(d.users); })
                  .catch(() => {});
              }}
              className="shrink-0 rounded-full bg-navy px-4 py-1.5 text-xs font-bold text-white"
            >
              Хайх
            </button>
          </div>
          <div className="mt-3 overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b">
                  <th className="p-3">Овог нэр / nickname</th>
                  <th className="p-3">Имэйл</th>
                  <th className="p-3">Нас / төрсөн</th>
                  <th className="p-3">Сургууль</th>
                  <th className="p-3">Багц</th>
                  <th className="p-3">Бүртгүүлсэн</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openUser(u.id)}
                    className="border-b last:border-0 align-top cursor-pointer hover:bg-blue-50/50 transition-colors"
                  >  <td className="p-3">
                      <div className="font-bold">
                        {[u.lastName, u.firstName].filter(Boolean).join(" ") || u.nickname || u.name || "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {u.nickname ? `@${u.nickname}` : ""} {u.role === "ADMIN" ? "• Админ" : ""}
                      </div>
                      {u.bio && <div className="mt-1 text-xs text-slate-500 max-w-[280px] truncate">{u.bio}</div>}
                    </td>
                    <td className="p-3 text-xs break-all">{u.email ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold">{u.age !== null ? `${u.age}` : "—"}</span>
                      <div className="text-xs text-slate-400">{u.birthDate || ""}</div>
                    </td>
                    <td className="p-3 text-xs">{u.school || "—"}</td>
                    <td className="p-3">
                      {u.plan ? (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${u.plan === "PRO" ? "bg-brand text-white" : "bg-slate-100"}`}>
                          {u.plan}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{String(u.createdAt).slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="mt-3 text-sm text-slate-500">Хэрэглэгч олдсонгүй.</div>
          )}
        </div>
      )}

      {/* Хэрэглэгчийн дэлгэрэнгүй drawer */}
      {detailId && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={closeUser} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-scale-up">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-black">Хэрэглэгчийн мэдээлэл</h3>
              <button onClick={closeUser} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-slate-600" aria-label="хаах">
                ✕
              </button>
            </div>
            <div className="p-6">
              {detailLoading || !detail ? (
                <div className="py-16 text-center text-sm text-slate-400">Ачааллаж байна...</div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand text-xl font-extrabold">
                      {(detail.user.nickname || detail.user.lastName || detail.user.name || "Х").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-extrabold text-black truncate">
                        {[detail.user.lastName, detail.user.firstName].filter(Boolean).join(" ") || detail.user.nickname || detail.user.name || "—"}
                      </div>
                      <div className="text-xs text-slate-500 break-all">{detail.user.email ?? "—"}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {detail.user.nickname && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold">@{detail.user.nickname}</span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${detail.user.role === "ADMIN" ? "bg-black text-white" : "bg-gray-100"}`}>
                          {detail.user.role === "ADMIN" ? "Админ" : "Хэрэглэгч"}
                        </span>
                        {detail.user.plan && (
                          <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-extrabold text-white">{detail.user.plan}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ["Нас", detail.user.age !== null ? `${detail.user.age}` : "—"],
                      ["Төрсөн өдөр", detail.user.birthDate || "—"],
                      ["Сургууль", detail.user.school || "—"],
                      ["Хайж буй", detail.user.lookingFor === "business" ? "Business" : "Study"],
                      ["Бүртгүүлсэн", String(detail.user.createdAt).slice(0, 10)],
                      ["Багц дуусах", detail.user.planEnds ? String(detail.user.planEnds).slice(0, 10) : "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl bg-[#F5F5F7] border border-gray-100 px-3.5 py-2.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{l}</div>
                        <div className="font-bold text-black truncate">{v}</div>
                      </div>
                    ))}
                    <div className="col-span-2 rounded-xl bg-[#F5F5F7] border border-gray-100 px-3.5 py-2.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Танилцуулга</div>
                      <div className="text-sm text-slate-700">{detail.user.bio || "—"}</div>
                    </div>
                    <div className="col-span-2 rounded-xl bg-[#F5F5F7] border border-gray-100 px-3.5 py-2.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Сонирхол</div>
                      <div className="text-sm text-slate-700">{detail.user.interests || "—"}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Үйл ажиллагаа</div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ["Захиалга", detail.stats.orders],
                        ["Ревью", detail.stats.reviews],
                        ["Match", detail.stats.matches],
                        ["Мессеж", detail.stats.messages],
                        ["Материал", detail.stats.materials],
                        ["Зар", detail.stats.ads],
                        ["Streak", `${detail.stats.sleepStreak}өд`],
                      ].map(([l, v]) => (
                        <div key={l} className="rounded-xl bg-[#F5F5F7] border border-gray-100 px-2 py-2.5">
                          <div className="text-base font-extrabold text-black">{v}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {detail.orders.length > 0 && (
                    <div>
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Сүүлийн захиалгууд</div>
                      <div className="space-y-1.5">
                        {detail.orders.map((o) => (
                          <div key={o.id} className="flex justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs">
                            <span className="font-bold truncate">{o.bookTitle}</span>
                            <span className="text-slate-500 shrink-0">{o.cashPaid.toLocaleString()}₮</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.payments.length > 0 && (
                    <div>
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Сүүлийн төлбөрүүд</div>
                      <div className="space-y-1.5">
                        {detail.payments.map((p) => (
                          <div key={p.id} className="flex justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs">
                            <span className="font-bold truncate">{p.purpose}</span>
                            <span className="shrink-0">
                              <span className={`font-extrabold ${p.status === "PAID" ? "text-emerald-600" : "text-slate-400"}`}>
                                {p.amount.toLocaleString()}₮
                              </span>{" "}
                              <span className="text-slate-400">{p.status}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {detail.user.role === "ADMIN" ? (
                      <button
                        onClick={() => setUserRole(detail.user.id, "USER")}
                        className="flex-1 rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-sm font-bold hover:bg-red-50"
                      >
                        Админ эрх хасах
                      </button>
                    ) : (
                      <button
                        onClick={() => setUserRole(detail.user.id, "ADMIN")}
                        className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
                      >
                        Админ эрх олгох
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "add" && (        <div className="mt-5 max-w-3xl rounded-3xl border bg-white p-5 md:p-7 space-y-4">
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
                <tr
                  key={p.id}
                  onClick={() => openPay(p.id)}
                  className="border-b last:border-0 cursor-pointer hover:bg-blue-50/50 transition-colors"
                >  <td className="p-3 font-bold">{p.bookTitle}
                    <div className="text-xs font-normal text-slate-400">
                      {p.buyer} • {p.method === "TRANSFER" ? "Шилжүүлэг" : "QPay"} • {p.purpose}
                      {p.refId ? ` • ${p.refId.slice(0, 8)}` : ""}
                    </div>
                  </td>
                  <td className="p-3 font-bold">{p.amount.toLocaleString()}₮</td>
                  <td className="p-3 font-bold">{p.status}</td>
                  <td className="p-3 text-xs">{p.ebarimtId ? `✓ ${p.ebarimtId.slice(0, 8)}` : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {p.status === "PENDING" && p.method === "QPAY" && (
                        <button onClick={() => syncPay(p.id)} className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand">
                          ↻ QPay шалгах
                        </button>
                      )}
                      {p.status === "PENDING" && (
                        <button onClick={() => confirmPay(p.id, p.method)} className="rounded bg-sage px-2.5 py-1 text-xs font-bold text-white">
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

      {/* Төлбөрийн дэлгэрэнгүй drawer */}
      {payDetailId && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={closePay} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-scale-up">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-black">Төлбөрийн дэлгэрэнгүй</h3>
              <button onClick={closePay} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-slate-600" aria-label="хаах">
                ✕
              </button>
            </div>
            <div className="p-6">
              {payLoading || !payDetail ? (
                <div className="py-16 text-center text-sm text-slate-400">Ачааллаж байна...</div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-extrabold text-black">{payDetail.payment.ref}</div>
                      <div className="text-xs text-slate-400">ID: {payDetail.payment.id.slice(0, 13)}…</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
                      payDetail.payment.status === "PAID" ? "bg-emerald-100 text-emerald-700"
                      : payDetail.payment.status === "PENDING" ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      {payDetail.payment.status}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#F5F5F7] border border-gray-100 p-5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Нийлбэр</div>
                    <div className="mt-1 text-3xl font-extrabold text-black">
                      {payDetail.payment.amount.toLocaleString()}₮
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                        <div className="text-slate-400 font-bold">Арга</div>
                        <div className="font-extrabold">{payDetail.payment.method === "TRANSFER" ? "Шилжүүлэг" : "QPay"}</div>
                      </div>
                      <div className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                        <div className="text-slate-400 font-bold">Зориулалт</div>
                        <div className="font-extrabold">{payDetail.payment.purpose}</div>
                      </div>
                      <div className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                        <div className="text-slate-400 font-bold">Үүссэн</div>
                        <div className="font-extrabold">{String(payDetail.payment.createdAt).slice(0, 16).replace("T", " ")}</div>
                      </div>
                      <div className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                        <div className="text-slate-400 font-bold">Төлсөн</div>
                        <div className="font-extrabold">
                          {payDetail.payment.paidAt ? String(payDetail.payment.paidAt).slice(0, 16).replace("T", " ") : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Худалдан авагч</div>
                    {payDetail.buyer ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-black truncate">{payDetail.buyer.name}</div>
                          <div className="text-xs text-slate-500 truncate">{payDetail.buyer.email ?? ""}</div>
                        </div>
                        <button
                          onClick={() => { closePay(); openUser(payDetail.buyer!.id); }}
                          className="shrink-0 rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand hover:bg-brand hover:text-white transition-colors"
                        >
                          Хэрэглэгч харах →
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Устгагдсан хэрэглэгч</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Бараа / үйлчилгээ</div>
                    <div className="text-sm font-extrabold text-black">{payDetail.item.title}</div>
                    <div className="text-xs text-slate-400">
                      {payDetail.item.kind}
                      {payDetail.item.id ? ` • ${payDetail.item.id.slice(0, 8)}` : ""}
                    </div>
                    {payDetail.order && (
                      <div className="mt-1 text-xs text-slate-500">
                        Захиалга: {payDetail.order.id.slice(0, 8)} • {payDetail.order.cashPaid.toLocaleString()}₮
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">QPay</div>
                    {[
                      ["Invoice ID", payDetail.payment.qpayInvoiceId],
                      ["Payment ID", payDetail.payment.qpayPaymentId],
                    ].map(([l, v]) => (
                      <div key={l} className="flex items-center justify-between gap-2 rounded-xl bg-[#F5F5F7] px-3 py-2 text-xs">
                        <span className="text-slate-500 font-bold">{l}</span>
                        {v ? (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <code className="truncate font-mono">{String(v).slice(0, 20)}…</code>
                            <button onClick={() => copyText(String(v))} className="shrink-0 rounded-lg bg-white border px-2 py-0.5 font-bold text-brand">
                              Хуулах
                            </button>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">E-barimt</div>
                    {payDetail.payment.ebarimtId ? (
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <code className="font-mono font-bold">{payDetail.payment.ebarimtId.slice(0, 16)}…</code>
                        <button onClick={() => copyText(payDetail.payment.ebarimtId!)} className="rounded-lg bg-white border px-2 py-1 text-xs font-bold text-brand">
                          Хуулах
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">Үүсээгүй байна.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Timeline</div>
                    <div className="space-y-0">
                      {[
                        ["Үүссэн", payDetail.payment.createdAt, true],
                        ["Төлсөн", payDetail.payment.paidAt, !!payDetail.payment.paidAt],
                        ["E-barimt", payDetail.payment.ebarimtId ? payDetail.payment.createdAt : null, !!payDetail.payment.ebarimtId],
                      ].map(([l, v, done], i, arr) => (
                        <div key={l as string} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className={`mt-1 h-3 w-3 rounded-full ${done ? "bg-emerald-500" : "bg-gray-200"}`} />
                            {i < arr.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
                          </div>
                          <div className="pb-4">
                            <div className={`text-sm font-bold ${done ? "text-black" : "text-slate-400"}`}>{l}</div>
                            <div className="text-xs text-slate-400">
                              {v ? String(v).slice(0, 16).replace("T", " ") : "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {payDetail.payment.status === "PENDING" && payDetail.payment.method === "QPAY" && (
                      <button onClick={() => syncPay(payDetail.payment.id)} className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-brand">
                        QPay шалгах
                      </button>
                    )}
                    {payDetail.payment.status === "PENDING" && (
                      <>
                        <button onClick={() => confirmPay(payDetail.payment.id, payDetail.payment.method)} className="rounded-xl bg-sage px-4 py-2.5 text-sm font-bold text-white">
                          Баталгаажуулах
                        </button>
                        <button onClick={() => cancelPay(payDetail.payment.id)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold">
                          Цуцлах
                        </button>
                      </>
                    )}
                    {payDetail.payment.status === "PAID" && !payDetail.payment.ebarimtId && payDetail.payment.qpayPaymentId && (
                      <button onClick={() => ebarimtRetry(payDetail.payment.id)} className="rounded-xl bg-accent-light px-4 py-2.5 text-sm font-bold text-accent-dark">
                        Ebarimt дахин
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "ai" && (        <div className="mt-5 rounded-3xl border bg-white p-5">
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
