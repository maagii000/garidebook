"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Category } from "@/lib/types";
import BookCard from "@/components/BookCard";

type SourceTab = "all" | "official" | "user";

export default function CatalogPage() {
  const { books } = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<SourceTab>("all");
  const [cat, setCat] = useState<"" | Category>("");
  const [sort, setSort] = useState<"new" | "rating" | "price">("new");

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Каталоги</h1>
      <p className="text-sm text-slate-500 mt-1">
        Garidebook Stock (албан ёсны) + сурагчдын P2P зарууд — нийт {list.length} ном
      </p>

      <div className="mt-5 flex flex-col lg:flex-row gap-3 lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Ном, зохиолчоор хайх..."
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="flex gap-2 text-sm font-bold">
          {(
            [
              ["all", "Бүгд"],
              ["official", "Garidebook Stock"],
              ["user", "Сурагчдын (P2P)"],
            ] as [SourceTab, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-full px-4 py-2 border ${
                tab === v
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-slate-600 border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as "" | Category)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Ангилал: Бүгд</option>
          <option value="children">Хүүхдийн</option>
          <option value="fiction">Уран зохиол</option>
          <option value="textbook">Сурах бичиг</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "new" | "rating" | "price")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="new">Эрэмбэ: Шинэ нь эхэнд</option>
          <option value="rating">Эрэмбэ: Үнэлгээ өндөр</option>
          <option value="price">Эрэмбэ: Үнэ хямд</option>
        </select>
        <span className="ml-auto self-center text-xs text-slate-500">
          Туршилтын үнэ: ~5,000₮ эсвэл Кредит + Мөнгө
        </span>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Ном олдсонгүй. Шүүлтүүрээ суллана уу.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
