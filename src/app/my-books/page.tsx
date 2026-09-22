"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { BookStatus } from "@/lib/types";
import BookCard from "@/components/BookCard";

export default function MyBooksPage() {
  const { myBooks, loading } = useStore();
  const [filter, setFilter] = useState<"" | BookStatus>("");

  const list = filter ? myBooks.filter((b) => b.status === filter) : myBooks;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Миний оруулсан номууд</h1>
          <p className="text-sm text-slate-500">Төлөв: Зарагдсан / Идэвхтэй / Шалгагдаж байгаа</p>
        </div>
        <Link href="/books/new" className="ml-auto rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-dark">
          ➕ Шинэ ном нэмэх
        </Link>
      </div>

      <div className="mt-4 flex gap-2 text-sm font-bold">
        {([["", "Бүгд"], ["pending", "Шалгагдаж байгаа"], ["active", "Идэвхтэй"], ["sold", "Зарагдсан"]] as ["" | BookStatus, string][]).map(([v, l]) => (
          <button key={l} onClick={() => setFilter(v)}
            className={`rounded-full px-4 py-2 border ${filter === v ? "bg-navy text-white border-navy" : "bg-white border-slate-300"}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-500">Ачааллаж байна...</div>
      ) : list.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed p-10 text-center bg-white text-slate-500">
          Оруулсан ном алга. <Link href="/books/new" className="text-accent-dark font-bold">Энд дарж</Link> анхны номоо оруулаад кредит аваарай.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  );
}
