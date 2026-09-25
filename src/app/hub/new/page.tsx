"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import PayModal from "@/components/PayModal";
import { UPLOAD_FEE } from "@/lib/payments";

export default function NewMaterialPage() {
  const router = useRouter();
  const { notify } = useStore();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [showPay, setShowPay] = useState(false);

  function readyToPay() {
    if (!title.trim()) { notify("Гарчиг шаардлагатай", "err"); return false; }
    if (!file) { notify("Файл сонгоно уу", "err"); return false; }
    return true;
  }

  async function publishWithPayment(paymentId: string) {
    setBusy(true);
    try {
      // 1. signed URL авч файл upload
      setStep("Файл upload хийж байна...");
      const ext = file!.name.split(".").pop() || "pdf";
      const u = await fetch("/api/hub/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ext }),
      }).then((r) => r.json());
      if (!u.url) throw new Error(u.error || "Upload URL алдаа");
      const put = await fetch(u.url, { method: "PUT", body: file! });
      if (!put.ok) throw new Error("Файл upload амжилтгүй");

      // 2. материал нийтлэх
      setStep("Нийтэлж байна...");
      const r = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          description: description.trim(),
          filePath: u.path,
          fileName: file!.name,
          fileSize: file!.size,
          price: Math.max(0, Math.floor(Number(price) || 0)),
          paymentId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Нийтлэхэд алдаа");
      notify("Материал хүлээн авлаа — админ зөвшөөрсний дараа идэвхжинэ");
      router.push("/hub");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
      setShowPay(false);
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Материал оруулах</h1>
      <p className="mt-1 text-sm text-slate-500">
        Сорил, лекц, тэмдэглэл — оруулах хураамж <b className="text-accent-dark">{UPLOAD_FEE.toLocaleString()}₮</b>.
      </p>

      <div className="mt-6 rounded-3xl border bg-white p-5 md:p-7 space-y-4">
        <label
          className="block rounded-2xl border-2 border-dashed border-slate-300 bg-paper p-6 text-center cursor-pointer hover:border-accent"
          onClick={() => document.getElementById("hub-file")?.click()}>
          <input id="hub-file" type="file" className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="font-bold">
            {file ? `${file.name} (${(file.size / 1048576).toFixed(1)}MB)` : "Файл сонгох"}
          </div>
          <div className="text-xs text-slate-500">PDF, Word, PPT, ZIP, зураг</div>
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold">Гарчиг *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ж: Математик шалгалтын сорил"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Хичээл</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ж: Математик"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block md:col-span-1">
            <span className="text-sm font-bold">Тайлбар</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Агуулга, хуудасны тоо..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Үнэ (₮, 0 = үнэгүй)</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h4 className="font-bold text-sm mb-3 text-black">Орлогын хуваарилалт (70/30)</h4>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Системийн байршуулах хураамж:</span>
            <span className="font-bold text-black">₮{UPLOAD_FEE.toLocaleString()}</span>
          </div>
          <div className="w-full h-px bg-blue-200/50 my-3" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Таны материалыг өөр оюутан худалдаж авах бүрт та <b>70%</b>-ийг шууд хүлээн авна. Систем 30%-ийг суутгана.
          </p>
        </div>

        <button
          onClick={() => { if (readyToPay() && !busy) setShowPay(true); }}
          disabled={busy}
          className="w-full rounded-xl bg-accent px-5 py-3.5 font-extrabold text-white hover:bg-accent-dark disabled:opacity-50">
          {busy ? step || "Нийтэлж байна..." : `${UPLOAD_FEE.toLocaleString()}₮ төлж нийтлэх`}
        </button>
        <p className="text-xs text-slate-400 text-center">Төлбөр баталгаажмагц «Шалгагдаж байгаа» төлөвт орно.</p>
      </div>

      {showPay && !busy && (
        <PayModal
          title="Материал оруулах хураамж"
          amount={UPLOAD_FEE}
          description="Garidebook Hub: файл оруулах"
          purpose="UPLOAD_FEE"
          onPaid={(pid) => { setShowPay(false); publishWithPayment(pid); }}
          onClose={() => setShowPay(false)}
        />
      )}
    </div>
  );
}
