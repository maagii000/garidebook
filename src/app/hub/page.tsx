"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Material {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName: string;
  fileSize: number;
  price: number;
  kind: string;
  downloads: number;
  ownerName: string;
}

const KINDS = ["Лекц", "Курсын ажил", "Шалгалтын материал", "Видео хичээл"];

export default function HubPage() {
  const [rows, setRows] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [program, setProgram] = useState("all");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hub")
      .then((r) => r.json())
      .then((d) => { setRows(d.materials ?? []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/hub?subjects=1")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.subjects)) setSubjects(d.subjects); })
      .catch(() => {});
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((m) => {
      if (program !== "all" && m.subject !== program) return false;
      if (kind !== "all" && (m.kind || "") !== kind) return false;
      if (s && !(m.title + " " + m.subject + " " + m.description + " " + m.ownerName).toLowerCase().includes(s)) return false;
      return true;
    });
  }, [rows, program, kind, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-black tracking-tight">Мэдлэгийн сан</h2>
          <p className="text-sm text-slate-500 mt-1">Шалгалт, курсын ажил, лекцийн материалууд</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hub/new" className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-dark shadow-md flex items-center gap-2 whitespace-nowrap">
            Файл байршуулах
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 mt-6">
        {["all", ...subjects].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setProgram(s)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              program === s ? "bg-brand text-white shadow-sm" : "bg-white text-black border border-gray-200 hover:border-brand"
            }`}
          >
            {s === "all" ? "Бүгд" : s}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 mt-4">
        <div className="relative w-full sm:w-96">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-3 text-slate-400">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text" placeholder="Хичээлийн нэр, сэдэв эсвэл зохиогчоор хайх..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] rounded-xl border border-gray-200/80 text-sm text-black focus:outline-none focus:border-brand" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500">Ангилал:</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-brand">
            <option value="all">Бүх төрөл</option>
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 text-center text-sm text-slate-400">Ачааллаж байна...</div>
      ) : list.length === 0 ? (
        <div className="col-span-full py-12 text-center text-slate-500 space-y-2">
          <p className="text-sm font-medium">Тохирох материал олдсонгүй.</p>
          <Link href="/hub/new" className="inline-block mt-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">
            Материал оруулах
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {list.map((m) => (
            <div key={m.id} className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:border-brand transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[11px] font-semibold">{m.subject || "Ерөнхий"}</span>
                  <span className="text-xs font-medium text-slate-500">{m.kind || "Материал"}</span>
                </div>
                <Link href={`/hub/${m.id}`}>
                  <h4 className="font-bold text-base text-black group-hover:text-brand transition-colors clamp-2">{m.title}</h4>
                </Link>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 inline-block" />
                  <span className="truncate">{m.ownerName}</span>
                </p>
              </div>
              <div className="pt-6 border-t border-gray-200/60 flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>
                    {m.downloads ?? 0}
                  </span>
                  <span className="font-bold text-black">{m.price > 0 ? `₮${m.price.toLocaleString()}` : "Үнэгүй"}</span>
                </div>
                <Link href={`/hub/${m.id}`} className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-medium hover:bg-brand-dark shadow-sm transition-all">
                  Татах
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
