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
  purpose: "UPLOAD_FEE" | "AD_FEE" | "MEMBERSHIP";
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
  const [paymentId, setPaymentId] = useState<string | null>(null);
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
      setPaymentId(d.paymentId);
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-navy">{title}</h2>
            <div className="text-2xl font-extrabold text-navy mt-1">{amount.toLocaleString()}₮</div>
          </div>
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-bold text-slate-500" aria-label="хаах">✕</button>
        </div>

        {!qr && !transfer && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
              <button onClick={() => setMethod("qpay")}
                className={`rounded-xl border px-4 py-3 ${method === "qpay" ? "bg-navy text-white border-navy" : "bg-white border-slate-300"}`}>
                QPay QR
              </button>
              <button onClick={() => setMethod("transfer")}
                className={`rounded-xl border px-4 py-3 ${method === "transfer" ? "bg-navy text-white border-navy" : "bg-white border-slate-300"}`}>
                Шилжүүлэг
              </button>
            </div>
            {err && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600">{err}</div>}
            <button onClick={start} disabled={busy}
              className="mt-4 w-full rounded-xl bg-accent px-5 py-3.5 font-extrabold text-white hover:bg-accent-dark disabled:opacity-50">
              {busy ? "Үүсгэж байна..." : `${amount.toLocaleString()}₮ төлөх`}
            </button>
          </>
        )}

        {qr && !transfer && (
          <div className="mt-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QPay QR" className="mx-auto h-60 w-60 rounded-2xl border bg-white p-3" />
            {shortUrl && (
              <a href={shortUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-accent-dark hover:underline">
                Утаснаасаа шууд төлөх →
              </a>
            )}
            {bankApps.length > 0 && (
              <div className="mt-3 rounded-2xl border bg-white p-3 text-left">
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Банк апп сонгох</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {bankApps.map((b) => (
                    <a key={b.name} href={b.link} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 hover:border-navy transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logo} alt="" className="h-7 w-7 rounded-lg object-contain bg-white" />
                      <span className="truncate text-xs font-extrabold text-slate-800">{b.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" /> Төлбөр хүлээж байна...
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Төлбөрийн ID: {paymentId?.slice(0, 8).toUpperCase()}</div>
          </div>
        )}

        {transfer && (
          <div className="mt-4 space-y-2.5 text-sm">
            {([
              ["Банк", transfer.bank.bankName],
              ["Данс", transfer.bank.account],
              ["Хүлээн авагч", transfer.bank.receiver],
              ["Гүйлгээний утга", transfer.ref],
              ["Дүн", `${amount.toLocaleString()}₮`],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} className="flex items-center justify-between gap-2 rounded-xl bg-paper border px-3.5 py-2.5">
                <span className="text-slate-500">{l}</span>
                <span className="font-extrabold text-right break-all">{v}</span>
                <button onClick={() => copy(v)} className="shrink-0 rounded-lg bg-navy-light px-2 py-1 text-xs font-bold text-navy">Хуулах</button>
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
