"use client";

import { useEffect, useRef, useState } from "react";

interface BankApp {
  name: string;
  description: string;
  logo: string;
  link: string;
}

interface Props {
  title: string;
  amount: number;
  description: string;
  purpose: "UPLOAD_FEE" | "AD_FEE" | "MEMBERSHIP" | "MATERIAL";
  refId?: string;
  onPaid: (paymentId: string) => void;
  onClose: () => void;
}

// Ерөнхий төлбөрийн modal: QPay QR + банк апп + шилжүүлэг, polling-той.
export default function PayModal({ title, amount, description, purpose, refId, onPaid, onClose }: Props) {
  const [method, setMethod] = useState<"qpay" | "transfer">("qpay");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [bankApps, setBankApps] = useState<BankApp[]>([]);
  const [transfer, setTransfer] = useState<{ paymentId: string; bank: { bankName: string; account: string; receiver: string }; ref: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function startPoll(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await fetch(`/api/payments/${id}`).then((r) => r.json());
        if (s.status === "PAID") {
          if (pollRef.current) clearInterval(pollRef.current);
          onPaid(id);
        }
      } catch { /* keep polling */ }
    }, 5000);
  }

  async function start() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, refId, amount, description, method }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Төлбөр үүсгэхэд алдаа"); return; }
      if (d.paid) { onPaid(d.paymentId ?? ""); return; }
      if (d.transfer) {
        setTransfer({ paymentId: d.paymentId, bank: d.bank, ref: d.ref });
        startPoll(d.paymentId);
        return;
      }
      setQr(`data:image/png;base64,${d.qr_image}`);
      setShortUrl(d.shortUrl ?? null);
      setBankApps(d.bankApps ?? []);
      startPoll(d.paymentId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  const copy = (t: string) => {
    navigator.clipboard?.writeText(t).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl text-center relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors" aria-label="хаах">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <h3 className="text-2xl font-bold mb-1 text-black">Төлбөр төлөх</h3>
        <p className="text-slate-500 text-sm mb-1">{title}</p>
        <p className="text-black text-lg font-extrabold mb-6">{amount.toLocaleString()}₮</p>

        {!qr && !transfer && (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm font-bold text-left">
              <button onClick={() => setMethod("qpay")}
                className={`rounded-xl border px-4 py-3 ${method === "qpay" ? "bg-black text-white border-black" : "bg-white border-gray-200"}`}>
                QPay QR
              </button>
              <button onClick={() => setMethod("transfer")}
                className={`rounded-xl border px-4 py-3 ${method === "transfer" ? "bg-black text-white border-black" : "bg-white border-gray-200"}`}>
                Шилжүүлэг
              </button>
            </div>
            {err && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 text-left">{err}</div>}
            <button onClick={start} disabled={busy}
              className="mt-4 w-full rounded-xl bg-brand px-5 py-4 font-bold text-white shadow-md hover:bg-brand-dark disabled:opacity-50 transition-all">
              {busy ? "Үүсгэж байна..." : "Төлбөр шалгах"}
            </button>
          </>
        )}

        {qr && !transfer && (
          <>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QPay QR" className="h-48 w-48 rounded-xl bg-white" />
            </div>
            {shortUrl && (
              <a href={shortUrl} target="_blank" rel="noreferrer" className="block text-sm font-bold text-brand hover:underline">
                Утаснаасаа шууд төлөх →
              </a>
            )}
            {bankApps.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-3">Банк сонгох</p>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {bankApps.slice(0, 8).map((b, i) => (
                    <a key={b.name} href={b.link} target="_blank" rel="noreferrer" title={b.description || b.name}
                      className="h-14 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm overflow-hidden"
                      style={{ backgroundColor: ["#14B8A6", "#3B82F6", "#F97316", "#8B5CF6", "#111111", "#0EA5E9", "#10B981", "#6366F1"][i % 8] }}>
                      {b.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt={b.name} className="h-8 w-8 rounded-lg object-contain bg-white/90 p-0.5" />
                      ) : (
                        <span className="text-[10px] font-bold px-1 text-center leading-tight">{b.name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </>
            )}
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" /> Төлбөр хүлээж байна...
            </div>
          </>
        )}

        {transfer && (
          <div className="mt-2 space-y-2.5 text-sm text-left">
            {([
              ["Банк", transfer.bank.bankName],
              ["Данс", transfer.bank.account],
              ["Хүлээн авагч", transfer.bank.receiver],
              ["Гүйлгээний утга", transfer.ref],
              ["Дүн", `${amount.toLocaleString()}₮`],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                <span className="text-slate-500">{l}</span>
                <span className="font-extrabold text-right break-all text-black">{v}</span>
                <button onClick={() => copy(v)} className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-brand">Хуулах</button>
              </div>
            ))}
            <p className="text-xs text-slate-500 leading-5">Шилжүүлсний дараа админ баталгаажуулмагц үргэлжилнэ. Гүйлгээний утгаа заавал бичнэ үү.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" /> Баталгаажуулалт хүлээж байна...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
