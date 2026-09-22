"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { credit, txs, orders, notify } = useStore();

  if (status === "loading") {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-500">Ачааллаж байна...</div>;
  }
  if (!session?.user) {
    return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Эхлээд нэвтэрнэ үү</h1>
        <Link href="/login" className="mt-5 inline-block rounded-xl bg-navy px-6 py-3 font-bold text-white">
          Нэвтрэх
        </Link>
      </div>
    );
  }

  const name = session.user.name ?? session.user.email ?? "Хэрэглэгч";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-3xl bg-navy text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-2xl font-extrabold">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{name}</h1>
          <div className="text-white/60 text-sm">{session.user.email}</div>
          {(session.user as { role?: string }).role === "ADMIN" && (
            <Link href="/admin" className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold">
              Админ
            </Link>
          )}
        </div>
        <div className="rounded-2xl bg-white/10 px-5 py-4 text-center">
          <div className="text-xs font-bold text-white/60">КРЕДИТ ҮЛДЭГДЭЛ</div>
          <div className="text-3xl font-extrabold text-accent">{credit}</div>
          <div className="text-xs text-white/60">≈ {(credit * 10).toLocaleString()}₮ хөнгөлөлт</div>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl border bg-white p-5">
          <h2 className="font-extrabold text-navy">Кредит түүх</h2>
          <div className="mt-3 space-y-2 max-h-80 overflow-auto">
            {txs.length === 0 && <div className="text-sm text-slate-500">Түүх хоосон байна.</div>}
            {txs.map((t) => (
              <div key={t.id} className="flex justify-between gap-3 rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
                <div>
                  <div className="font-bold">{t.reason}</div>
                  {t.bookTitle && <div className="text-xs text-slate-500">{t.bookTitle}</div>}
                  <div className="text-[11px] text-slate-400">{String(t.createdAt).slice(0, 10)}</div>
                </div>
                <span className={`font-extrabold ${t.amount >= 0 ? "text-sage" : "text-red-500"}`}>
                  {t.amount >= 0 ? "+" : ""}{t.amount}
                </span>
              </div>
            ))}
          </div>
          <Link href="/books/new" className="mt-4 block text-center rounded-xl bg-accent px-4 py-3 font-bold text-white hover:bg-accent-dark">
            Ном оруулж кредит нэмэх
          </Link>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <h2 className="font-extrabold text-navy">Миний захиалгууд ({orders.length})</h2>
          <div className="mt-3 space-y-2 max-h-80 overflow-auto">
            {orders.length === 0 && <div className="text-sm text-slate-500">Захиалга байхгүй. Каталогиос сонгоорой.</div>}
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
                <div className="font-bold">{o.bookTitle}</div>
                <div className="text-xs text-slate-500">
                  Бэлэн: {o.cashPaid.toLocaleString()}₮ • Кредит: {o.creditSpent} • {String(o.createdAt).slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { notify("Та гарах гэж байна"); signOut({ callbackUrl: "/" }); }}
            className="mt-4 w-full rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-sm font-bold hover:bg-red-50"
          >
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}
