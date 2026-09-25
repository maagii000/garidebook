"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  price: number;
  description: string;
  ownerName: string;
  images: string[];
  createdAt: string;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ads")
      .then((r) => r.json())
      .then((d) => { setAds(d.ads ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const list = q.trim()
    ? ads.filter((a) =>
        (a.title + " " + a.description).toLowerCase().includes(q.toLowerCase())
      )
    : ads;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Хар зах</h1>
          <p className="text-sm text-slate-500 mt-1">
            Сурах бичиг, тэмдэглэл — сурагчдаас сурагчдад • {list.length} зар
          </p>
        </div>
        <Link href="/ads/new" className="ml-auto rounded-full bg-accent px-5 py-2.5 text-sm font-extrabold text-white hover:bg-accent-dark">
          Зар байршуулах (500₮)
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2.5 max-w-xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-400 shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Зар хайх..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-500">Ачааллаж байна...</div>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="font-extrabold text-slate-900">Зар алга</div>
          <p className="mt-1 text-sm text-slate-500">Эхний зарыг та байршуулаарай.</p>
          <Link href="/ads/new" className="mt-4 inline-block rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white">
            Зар байршуулах
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.map((a) => {
            const cover = a.images[0];
            return (
              <Link key={a.id} href={`/ads/${a.id}`}
                className="group overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 m-2 mb-0">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={a.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-600 to-indigo-800 p-3 text-center">
                      <span className="text-white text-sm font-extrabold leading-snug clamp-2">{a.title}</span>
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Зар
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-[13px] font-bold leading-snug clamp-2 min-h-[2.5em] text-slate-900">{a.title}</div>
                  <div className="text-xs text-slate-500 truncate">{a.ownerName}</div>
                  <div className="mt-1.5 text-sm font-extrabold text-navy">{a.price.toLocaleString()}₮</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
