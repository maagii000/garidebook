"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { MAX_CREDIT_USE_PER_ORDER, CREDIT_TO_MNT } from "@/lib/types";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { books, credit, checkout, notify } = useStore();
  const book = books.find((b) => b.id === id);
  const [use, setUse] = useState(100);
  const [busy, setBusy] = useState(false);

  if (!book) return <div className="p-10 text-center">Ном олдсонгүй</div>;

  const maxUse = Math.min(credit, MAX_CREDIT_USE_PER_ORDER, Math.floor(book.priceCash / CREDIT_TO_MNT));
  const clamped = Math.max(0, Math.min(use, maxUse));
  const cash = book.priceCash - clamped * CREDIT_TO_MNT;

  async function submit() {
    setBusy(true);
    const res = await checkout(book!.id, clamped);
    setBusy(false);
    if ("error" in res) { notify(res.error, "err"); return; }
    notify(`Захиалга амжилттай! ${res.order.cashPaid.toLocaleString()}₮ + ${res.order.creditSpent} кредит ✓`);
    router.push("/profile");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/books/${book.id}`} className="text-sm font-bold text-slate-500">← Ном руу буцах</Link>
      <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-navy">Төлбөр — Кредит + Мөнгө</h1>

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
            <input
              type="range" min={0} max={maxUse} value={clamped}
              onChange={(e) => setUse(Number(e.target.value))}
              className="mt-2 w-full accent-[#FF7A00]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0</span><span>max {maxUse} (2,000₮ хүртэл)</span>
            </div>
          </div>
          <div className="mt-3 border-t pt-3 flex justify-between items-center">
            <span className="font-bold">Бэлнээр төлөх</span>
            <span className="text-2xl font-extrabold text-navy">{cash.toLocaleString()}₮</span>
          </div>
        </div>

        <button onClick={submit} disabled={busy}
          className="mt-4 w-full rounded-xl bg-sage px-5 py-3.5 font-extrabold text-white hover:brightness-95 disabled:opacity-50">
          {busy ? "Захиалж байна..." : `✅ Захиалах — ${cash.toLocaleString()}₮ + ${clamped} кр`}
        </button>
        <p className="mt-2 text-[11px] text-slate-400 text-center">
          Бэлэн / шилжүүлгээр төлнө (COD). QPay дараагийн шатанд холбогдоно.
        </p>
      </div>
    </div>
  );
}
