"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Category } from "@/lib/types";
import BookCard from "@/components/BookCard";
import { GridSkeleton } from "@/components/Skeletons";

type SourceTab = "all" | "official" | "user";

const TABS: [SourceTab, string][] = [
  ["all", "Бүгд"],
  ["official", "Level Up Stock"],
  ["user", "Сурагчдын (P2P)"],
];

const CATS: { v: "" | Category; label: string }[] = [
  { v: "", label: "Бүгд" },
  { v: "children", label: "Хүүхдийн" },
  { v: "fiction", label: "Уран зохиол" },
  { v: "textbook", label: "Сурах бичиг" },
  { v: "self_help", label: "Хувь хүний хөгжил" },
  { v: "biography", label: "Намтар" },
];

function CatalogInner() {
  const { books } = useStore();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<SourceTab>("all");
  const [cat, setCat] = useState<"" | Category>("");
  const [sort, setSort] = useState<"new" | "rating" | "price">("new");

  useEffect(() => {
    const initial = sp.get("q");
    if (initial) {
      // URL query → state sync (legitimate effect use-case)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQ(initial);
    }
  }, [sp]);

  const list = useMemo(() => {
    let out = books.filter((b) => b.status !== "rejected");
    if (tab !== "all") out = out.filter((b) => b.source === tab);
    if (cat) out = out.filter((b) => b.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (b) =>
          b.title.toLowerCase().includes(s) ||
          b.author.toLowerCase().includes(s)
      );
    }
    out = [...out].sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "price") return a.priceCash - b.priceCash;
      return b.createdAt.localeCompare(a.createdAt);
    });
    return out;
  }, [books, q, tab, cat, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Хувь хүний хөгжил</h1>
      <p className="text-sm text-slate-500 mt-1">
        Level Up Stock (албан ёсны) + сурагчдын P2P зарууд — нийт {list.length} ном
      </p>

      <div className="mt-5 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2.5 focus-within:border-navy/40 focus-within:ring-2 focus-within:ring-navy/10">
          <span className="text-slate-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ном, зохиолчоор хайх..."
            className="w-full bg-transparent text-sm outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-2 text-sm font-bold overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 border transition ${
                tab === v
                  ? "bg-navy text-white border-navy shadow"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button
            key={c.label}
            onClick={() => setCat(c.v)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold border transition ${
              cat === c.v
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {c.label}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "new" | "rating" | "price")}
          className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-bold text-slate-600"
        >
          <option value="new">Эрэмбэ: Шинэ нь эхэнд</option>
          <option value="rating">Эрэмбэ: Үнэлгээ өндөр</option>
          <option value="price">Эрэмбэ: Үнэ хямд</option>
        </select>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Албан ёсны номууд + сурагчдын солилцоо
      </p>

      {list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mt-3 font-extrabold text-slate-900">Ном олдсонгүй</div>
          <p className="mt-1 text-sm text-slate-500">
            Шүүлтүүрээ суллана уу.
          </p>
          <button
            onClick={() => { setQ(""); setTab("all"); setCat(""); }}
            className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.map((b) => (
            <BookCard key={b.id} book={b} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        <GridSkeleton />
      </div>
    }>
      <CatalogInner />
    </Suspense>
  );
}
