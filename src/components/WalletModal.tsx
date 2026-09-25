"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

// Кредит хэтэвч modal (Apple prototype загвар).
// Одоогоор кредит оноо харуулна — мөнгөн хэтэвч биш.
export default function WalletModal({ onClose }: { onClose: () => void }) {
  const { credit, txs } = useStore();
  const recent = txs.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-scale-up space-y-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors" aria-label="хаах">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16V7" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-black">Кредит хэтэвч</h3>
            <p className="text-xs text-slate-500">Ном оруулж цуглуулсан кредит (1кр = 10₮ хөнгөлөлт)</p>
          </div>
        </div>

        <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-gray-200 text-center space-y-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Таны үлдэгдэл</span>
          <div className="text-4xl font-extrabold text-brand">{credit.toLocaleString()} кр</div>
          <p className="text-[11px] text-slate-500">≈ {(credit * 10).toLocaleString()}₮ хөнгөлөлт</p>
        </div>

        {recent.length > 0 && (
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex justify-between gap-3 rounded-xl bg-[#F5F5F7] border border-gray-100 px-3.5 py-2 text-sm">
                <span className="font-medium truncate">{t.reason}</span>
                <span className={`font-extrabold shrink-0 ${t.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {t.amount >= 0 ? "+" : ""}{t.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <Link href="/profile" onClick={onClose}
            className="block w-full py-3 rounded-2xl bg-brand text-white font-medium hover:bg-brand-dark shadow-md transition-all text-center">
            Дэлгэрэнгүй (Кредит данс)
          </Link>
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white border border-gray-200 text-black font-medium hover:border-brand transition-all">
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
