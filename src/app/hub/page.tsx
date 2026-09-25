"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Material {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName: string;
  fileSize: number;
  price: number;
  ownerName: string;
}

function fmtSize(b: number) {
  if (!b) return "";
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
}

export default function HubPage() {
  const [rows, setRows] = useState<Material[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hub")
      .then((r) => r.json())
      .then((d) => { setRows(d.materials ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const list = q.trim()
    ? rows.filter((m) =>
        (m.title + " " + m.subject + " " + m.description).toLowerCase().includes(q.toLowerCase())
      )
    : rows;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Мэдлэгийн сан</h1>
          <p className="text-sm text-slate-500 mt-1">
            Шалгалтын сорил, лекц, материал — оюутнаас оюутанд • {list.length}
          </p>
        </div>
        <Link href="/hub/new" className="ml-auto rounded-full bg-accent px-5 py-2.5 text-sm font-extrabold text-white hover:bg-accent-dark">
          Материал оруулах (3,900₮)
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
          placeholder="Сорил, лекц, хичээлээр хайх..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-500">Ачааллаж байна...</div>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="font-extrabold text-slate-900">Материал алга</div>
          <p className="mt-1 text-sm text-slate-500">Эхний материалыг та оруулаарай.</p>
          <Link href="/hub/new" className="mt-4 inline-block rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white">
            Материал оруулах
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <Link key={m.id} href={`/hub/${m.id}`}
              className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-md bg-navy-light px-2 py-0.5 text-[11px] font-bold text-navy">
                  {m.subject || "Ерөнхий"}
                </span>
                <span className={`text-sm font-extrabold ${m.price > 0 ? "text-navy" : "text-emerald-600"}`}>
                  {m.price > 0 ? `${m.price.toLocaleString()}₮` : "Үнэгүй"}
                </span>
              </div>
              <div className="mt-2 font-extrabold text-slate-900 leading-snug clamp-2 min-h-[2.6em]">{m.title}</div>
              <div className="mt-1 text-xs text-slate-500 truncate">
                {m.fileName} {m.fileSize ? `• ${fmtSize(m.fileSize)}` : ""} • {m.ownerName}
              </div>
              <p className="mt-2 text-[13px] text-slate-600 leading-6 clamp-2">{m.description || "Тайлбаргүй."}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
