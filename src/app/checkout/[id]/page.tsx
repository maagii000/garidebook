"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { MAX_CREDIT_USE_PER_ORDER, CREDIT_TO_MNT } from "@/lib/types";

interface PayState {
  paymentId: string;
  cash: number;
  creditUsed: number;
  qr_image: string;
  shortUrl?: string;
  bankApps?: { name: string; description: string; logo: string; link: string }[];
}

interface TransferState {
  paymentId: string;
  cash: number;
  creditUsed: number;
  bank: { bankName: string; account: string; receiver: string };
  ref: string;
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { books, credit, checkout, notify, refreshAll } = useStore();
  const book = books.find((b) => b.id === id);
  const [use, setUse] = useState(100);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"qpay" | "transfer">("qpay");
  const [pay, setPay] = useState<PayState | null>(null);
  const [transfer, setTransfer] = useState<TransferState | null>(null);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (!book) return <div className="p-10 text-center">Ном олдсонгүй</div>;
  const isEbook = !!book.hasPdf;

  const maxUse = Math.min(credit, MAX_CREDIT_USE_PER_ORDER, Math.floor(book.priceCash / CREDIT_TO_MNT));
  const clamped = Math.max(0, Math.min(use, maxUse));
  const cash = book.priceCash - clamped * CREDIT_TO_MNT;

  async function submitPhysical() {
    setBusy(true);
    const res = await checkout(book!.id, clamped);
    setBusy(false);
    if ("error" in res) { notify(res.error, "err"); return; }
    notify(`Захиалга амжилттай! ${res.order.cashPaid.toLocaleString()}₮ + ${res.order.creditSpent} кредит ✓`);
    router.push("/profile");
  }

  async function startQpay() {
    setBusy(true);
    try {
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book!.id, creditToUse: clamped, method }),
      });
      const d = await r.json();
      if (!r.ok) { notify(d.error || "Төлбөр үүсгэхэд алдаа", "err"); return; }
      if (d.paid || d.owned) {
        setPaid(true);
        refreshAll();
        return;
      }
      if (d.transfer) {
        setTransfer(d);
        // Poll admin confirmation
        pollRef.current = setInterval(async () => {
          try {
            const s = await fetch(`/api/payments/${d.paymentId}`).then((x) => x.json());
            if (s.status === "PAID") {
              if (pollRef.current) clearInterval(pollRef.current);
              setPaid(true);
              refreshAll();
              notify("Төлбөр баталгаажлаа ✓");
            }
          } catch { /* keep polling */ }
        }, 8000);
        return;
      }
      setPay(d);
      // Poll every 5s
      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`/api/payments/${d.paymentId}`).then((x) => x.json());
          if (s.status === "PAID") {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaid(true);
            refreshAll();
            notify("Төлбөр баталгаажлаа ✓");
          }
        } catch { /* keep polling */ }
      }, 5000);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
    } finally {
      setBusy(false);
    }
  }

  if (paid) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-6xl font-extrabold text-sage">✓</div>
        <h1 className="mt-4 text-2xl font-extrabold text-navy">Төлбөр амжилттай!</h1>
        <p className="mt-2 text-sm text-slate-500">«{book.title}» ном танд нээгдлээ.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={`/read/${book.id}`} className="rounded-xl bg-navy px-5 py-3.5 font-extrabold text-white">
            Номыг унших
          </Link>
          <Link href={`/books/${book.id}`} className="rounded-xl border px-5 py-3 font-bold">
            AI-аас асуух
          </Link>
        </div>
      </div>
    );
  }

  if (transfer) {
    const copy = (t: string) => {
      navigator.clipboard?.writeText(t).then(
        () => notify("Хууллаа ✓"),
        () => notify("Хуулах үед алдаа", "err")
      );
    };
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-xl font-extrabold text-navy text-center">Шилжүүлэг — {transfer.cash.toLocaleString()}₮</h1>
        <div className="mt-5 rounded-3xl border bg-white p-6 space-y-3">
          {([
            ["Банк", transfer.bank.bankName],
            ["Данс", transfer.bank.account],
            ["Хүлээн авагч", transfer.bank.receiver],
            ["Гүйлгээний утга", transfer.ref],
            ["Дүн", `${transfer.cash.toLocaleString()}₮`],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} className="flex items-center justify-between gap-2 rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
              <span className="text-slate-500">{l}</span>
              <span className="font-extrabold text-right break-all">{v}</span>
              <button onClick={() => copy(v)} className="shrink-0 rounded-lg bg-navy-light px-2 py-1 text-xs font-bold text-navy">Хуулах</button>
            </div>
          ))}
          <p className="text-xs text-slate-500 leading-5">
            Шилжүүлсний дараа админ баталгаажуулмагц ном нээгдэнэ (polling ажиллаж байна).
            Гүйлгээний утгаа заавал бичнэ үү!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <span className="h-3 w-3 animate-ping rounded-full bg-sage" /> Баталгаажуулалт хүлээж байна...
          </div>
        </div>
        <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setTransfer(null); }}
          className="mt-4 w-full text-sm text-slate-400 hover:underline">
          Болих
        </button>
      </div>
    );
  }

  if (pay) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center">
        <h1 className="text-xl font-extrabold text-navy">QPay-ээр төлөх — {pay.cash.toLocaleString()}₮</h1>
        <p className="mt-1 text-sm text-slate-500">Банкны аппаараа QR-ыг уншуулна уу. Төлсний дараа автоматаар нээгдэнэ.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${pay.qr_image}`} alt="QPay QR" className="mx-auto mt-5 h-72 w-72 rounded-2xl border bg-white p-3" />
        {pay.shortUrl && (
          <a href={pay.shortUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-accent-dark hover:underline">
            Утаснаасаа шууд төлөх →
          </a>
        )}
        {pay.bankApps && pay.bankApps.length > 0 && (
          <div className="mt-4 rounded-2xl border bg-white p-4 text-left">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Банк апп сонгох</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {pay.bankApps.map((b) => (
                <a key={b.name} href={b.link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-navy hover:bg-navy-light/40 transition">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt="" className="h-8 w-8 rounded-lg object-contain bg-white" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-extrabold text-slate-800">{b.name}</span>
                    <span className="block truncate text-[11px] text-slate-400">{b.description}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <span className="h-3 w-3 animate-ping rounded-full bg-sage" /> Төлбөр хүлээж байна...
        </div>
        <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setPay(null); }}
          className="mt-4 text-sm text-slate-400 hover:underline">
          Болих
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/books/${book.id}`} className="text-sm font-bold text-slate-500">← Ном руу буцах</Link>
      <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-navy">Төлбөр — Кредит + Мөнгө</h1>
      {isEbook && (
        <p className="mt-1 text-sm text-slate-500">Ebook — төлсний дараа унших + AI эрх нээгдэнэ. Татаж авах боломжгүй.</p>
      )}

      <div className="mt-5 rounded-3xl border bg-white p-6">
        <div className="font-extrabold text-lg">{book.title}</div>
        <div className="text-sm text-slate-500">{book.author}</div>

        <div className="mt-4 rounded-2xl bg-paper border p-4">
          <div className="flex justify-between text-sm">
            <span>Суурь үнэ</span>
            <b>{book.priceCash.toLocaleString()}₮</b>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm font-bold">
              <span>Ашиглах кредит (таны үлдэгдэл: {credit})</span>
              <span className="text-accent-dark">{clamped} кр = −{(clamped * CREDIT_TO_MNT).toLocaleString()}₮</span>
            </div>
            <input type="range" min={0} max={maxUse} value={clamped}
              onChange={(e) => setUse(Number(e.target.value))}
              className="mt-2 w-full accent-[#FF7A00]" />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0</span><span>max {maxUse} (2,000₮ хүртэл)</span>
            </div>
          </div>
          <div className="mt-3 border-t pt-3 flex justify-between items-center">
            <span className="font-bold">{isEbook ? "QPay-ээр төлөх" : "Бэлнээр төлөх"}</span>
            <span className="text-2xl font-extrabold text-navy">{cash.toLocaleString()}₮</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
          <button onClick={() => setMethod("qpay")}
            className={`rounded-xl border px-4 py-3 ${method === "qpay" ? "bg-navy text-white border-navy" : "bg-white border-slate-300"}`}>
            QPay QR
          </button>
          <button onClick={() => setMethod("transfer")}
            className={`rounded-xl border px-4 py-3 ${method === "transfer" ? "bg-navy text-white border-navy" : "bg-white border-slate-300"}`}>
            Шилжүүлэг
          </button>
        </div>

        <button onClick={isEbook ? startQpay : submitPhysical} disabled={busy}
          className="mt-4 w-full rounded-xl bg-sage px-5 py-3.5 font-extrabold text-white hover:brightness-95 disabled:opacity-50">
          {busy ? "Боловсруулж байна..." : isEbook
            ? method === "qpay"
              ? `QPay QR үүсгэх — ${cash.toLocaleString()}₮ + ${clamped} кр`
              : `Шилжүүлэг эхлүүлэх — ${cash.toLocaleString()}₮ + ${clamped} кр`
            : `Захиалах — ${cash.toLocaleString()}₮ + ${clamped} кр`}
        </button>
        {isEbook && (
          <p className="mt-2 text-[11px] text-slate-400 text-center">
            QPay sandbox тест орчин. Төлсний дараа e-barimt автоматаар үүснэ.
          </p>
        )}
      </div>
    </div>
  );
}
