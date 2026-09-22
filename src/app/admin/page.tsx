"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { BookStatus, STATUS_LABEL } from "@/lib/types";

interface PendingItem {
  id: string;
  title: string;
  author: string;
  ownerName: string;
  createdAt: string;
}

export default function AdminPage() {
  const { books, adminSetStatus } = useStore();
  const [counts, setCounts] = useState({ total: 0, active: 0, pending: 0, sold: 0, users: 0 });
  const [pending, setPending] = useState<PendingItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((d) => {
        if (d.counts) setCounts(d.counts);
        if (d.pending) setPending(d.pending);
      })
      .catch(() => {});
  }, [books]);

  function set(id: string, s: BookStatus) {
    adminSetStatus(id, s);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">🛠 Админ — ном / хэрэглэгч удирдах</h1>
      <p className="text-sm text-slate-500">Зөвхөн ADMIN role-той нэвтэрсэн хэрэглэгч хандах боломжтой.</p>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
        {([["Нийт ном", counts.total], ["Идэвхтэй", counts.active], ["Шалгагдаж буй", counts.pending], ["Зарагдсан", counts.sold], ["Хэрэглэгч", counts.users]] as [string, number][]).map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-extrabold text-navy">{v}</div>
            <div className="text-xs text-slate-500 font-bold">{l}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-extrabold text-navy">⏳ Шалгагдаж байгаа ({pending.length})</h2>
      {pending.length === 0 && (
        <div className="mt-3 rounded-2xl bg-sage-light border border-emerald-200 p-5 text-sm text-emerald-800">
          ✓ Бүх постыг шалгасан байна. Шинэ ном нэмэгдвэл энд гарна.
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
              <button onClick={() => set(b.id, "active")} className="rounded-lg bg-sage px-4 py-2 text-sm font-bold text-white">
                ✓ Зөвшөөрөх
              </button>
              <button onClick={() => set(b.id, "rejected")} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-600">
                ✕ Татгалзах
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-extrabold text-navy">📚 Бүх ном</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b">
              <th className="p-3">Ном</th>
              <th className="p-3">Эзэмшигч</th>
              <th className="p-3">Төлөв</th>
              <th className="p-3">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3 font-bold">{b.title}<div className="text-xs font-normal text-slate-400">{b.author}</div></td>
                <td className="p-3 text-slate-500">{b.ownerName}</td>
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
  );
}
