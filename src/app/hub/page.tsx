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

function extOf(name: string) {
  return (name.split(".").pop() || "").toUpperCase().slice(0, 5);
}

const TILE_THEMES = [
  { tile: "bg-blue-50 text-brand", text: "text-brand", avatar: "from-blue-400 to-purple-500" },
  { tile: "bg-green-50 text-green-600", text: "text-green-600", avatar: "from-green-400 to-emerald-500" },
  { tile: "bg-orange-50 text-accent", text: "text-accent", avatar: "from-orange-400 to-red-500" },
  { tile: "bg-violet-50 text-violet-600", text: "text-violet-600", avatar: "from-violet-400 to-fuchsia-500" },
];

function themeFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TILE_THEMES[h % TILE_THEMES.length];
}

function FileIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">Мэдлэгийн сан</h1>
          <p className="text-slate-500">Шалгалт, бие даалт, лекцийн материалууд.</p>
        </div>
        <Link href="/hub/new" className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2 shadow-apple whitespace-nowrap">
          Файл оруулах
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2.5 max-w-xl shadow-sm">
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
        <div className="mt-10 rounded-[2rem] border border-dashed border-gray-200 bg-white p-10 text-center shadow-apple">
          <div className="font-extrabold text-black">Материал алга</div>
          <p className="mt-1 text-sm text-slate-500">Эхний материалыг та оруулаарай.</p>
          <Link href="/hub/new" className="mt-4 inline-block rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">
            Материал оруулах
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((m) => {
            const t = themeFor(m.id);
            return (
              <Link key={m.id} href={`/hub/${m.id}`}
                className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-apple card-hover flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.tile}`}>
                    <FileIcon />
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{extOf(m.fileName) || "FILE"}</span>
                </div>
                <span className={`text-xs font-semibold mb-2 ${t.text}`}>{m.subject || "Ерөнхий"}</span>
                <h3 className="text-lg font-bold mb-2 leading-tight text-black clamp-2">{m.title}</h3>
                <p className="text-sm text-slate-500 mb-6 flex-grow clamp-2">
                  {m.description || `${m.fileName}${m.fileSize ? ` • ${fmtSize(m.fileSize)}` : ""}`}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${t.avatar} shrink-0`} />
                    <span className="text-xs font-medium text-gray-700 truncate">{m.ownerName}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${m.price > 0 ? "bg-black text-white" : "bg-emerald-500 text-white"}`}>
                    {m.price > 0 ? `₮${m.price.toLocaleString()}` : "Үнэгүй"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
