"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import BookCard from "@/components/BookCard";
import { GridSkeleton } from "@/components/Skeletons";

export default function WishlistPage() {
  const { wishlistBooks, loading } = useStore();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">🤍 Хүслийн жагсаалт ({wishlistBooks.length})</h1>
      {loading ? (
        <GridSkeleton count={8} />
      ) : wishlistBooks.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed bg-white p-10 text-center text-slate-500">
          Хадгалсан ном алга. <Link href="/catalog" className="font-bold text-accent-dark">Каталогиос</Link> ♡ дарж хадгална.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistBooks.map((b) => <BookCard key={b.id} book={b} className="w-full" />)}
        </div>
      )}
    </div>
  );
}
