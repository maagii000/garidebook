"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import PayModal from "@/components/PayModal";
import { AD_FEE } from "@/lib/payments";

export default function NewAdPage() {
  const router = useRouter();
  const { notify } = useStore();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);

  function onFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, 3 - files.length);
    if (arr.length === 0) return;
    setFiles((p) => [...p, ...arr].slice(0, 3));
    arr.forEach((f) => {
      const r = new FileReader();
      r.onload = () => { if (typeof r.result === "string") setPreviews((p) => [...p, r.result as string].slice(0, 3)); };
      r.readAsDataURL(f);
    });
  }

  function readyToPay() {
    if (!title.trim()) { notify("Зарын гарчиг шаардлагатай", "err"); return false; }
    if (!(Math.floor(Number(price) || 0) > 0)) { notify("Үнэ буруу", "err"); return false; }
    return true;
  }

  async function publishWithPayment(paymentId: string) {
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const form = new FormData();
        form.append("file", f);
        const r = await fetch("/api/uploads", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Зураг upload амжилтгүй");
        urls.push(d.url);
      }
      const r = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), price: Math.floor(Number(price)),
          description: description.trim(), contact: contact.trim(),
          images: urls, paymentId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Нийтлэхэд алдаа");
      notify("Зар хүлээн авлаа — админ зөвшөөрсний дараа идэвхжинэ");
      router.push("/ads");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
      setShowPay(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Зар байршуулах</h1>
      <p className="mt-1 text-sm text-slate-500">
        Сурах бичиг, тэмдэглэл зарна. Байршуулах хураамж <b className="text-accent-dark">{AD_FEE.toLocaleString()}₮</b> (QPay / шилжүүлэг).
      </p>

      <div className="mt-6 rounded-3xl border bg-white p-5 md:p-7 space-y-4">
        <div
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-paper p-6 text-center cursor-pointer hover:border-accent"
          onClick={() => document.getElementById("ad-file-input")?.click()}
        >
          <input id="ad-file-input" type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => onFiles(e.target.files)} />
          {previews.length === 0 ? (
            <div>
              <div className="mt-2 font-bold">Зураг сонгох (max 3)</div>
              <div className="text-xs text-slate-500">Барааны зураг (max 5MB/зураг)</div>
            </div>
          ) : (
            <div className="flex gap-2 justify-center flex-wrap">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-24 w-24 rounded-xl object-cover border" />
              ))}
              {previews.length < 3 && <span className="text-sm text-slate-400 self-center">+ нэмэх</span>}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold">Гарчиг *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ж: Математик сурах бичиг, 10-р анги"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Үнэ (₮) *</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="ж: 8000"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold">Тайлбар</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="Байдал, ашигласан хугацаа..."
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
        </label>

        <label className="block">
          <span className="text-sm font-bold">Холбоо барих (утас)</span>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="ж: 99112233"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
        </label>

        <button
          onClick={() => { if (readyToPay() && !busy) setShowPay(true); }}
          disabled={busy}
          className="w-full rounded-xl bg-accent px-5 py-3.5 font-extrabold text-white hover:bg-accent-dark disabled:opacity-50">
          {busy ? "Нийтэлж байна..." : `${AD_FEE.toLocaleString()}₮ төлж нийтлэх`}
        </button>
        <p className="text-xs text-slate-400 text-center">Төлбөр баталгаажмагц зар «Шалгагдаж байгаа» төлөвт орно.</p>
      </div>

      {showPay && !busy && (
        <PayModal
          title="Зар байршуулах хураамж"
          amount={AD_FEE}
          description="LevelUp: зар байршуулах"
          purpose="AD_FEE"
          onPaid={(pid) => { setShowPay(false); publishWithPayment(pid); }}
          onClose={() => setShowPay(false)}
        />
      )}
    </div>
  );
}
