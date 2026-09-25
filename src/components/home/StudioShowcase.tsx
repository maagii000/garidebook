"use client";

import Link from "next/link";
import { Book } from "@/lib/types";
import BookCard from "@/components/BookCard";
import CoverArt from "@/components/CoverArt";

export default function StudioShowcase({ books }: { books: Book[] }) {
  const feature = books[0];
  const row = books.slice(0, 5);
  if (books.length === 0) return null;

  const cover = feature?.images?.[0] || feature?.coverUrl;

  return (
    <section className="mx-auto max-w-7xl px-4 mt-12">
      <h2 className="text-center text-xl md:text-2xl font-extrabold text-slate-900">
        <span className="text-blue-600">Garidebook</span> студи-с толилуулж буй бүтээлүүд
      </h2>
      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr] items-start">
        {/* Утасны mockup — одоогийн онцлох ном */}
        <div className="mx-auto w-[240px] shrink-0 rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
          <div className="relative bg-white">
            <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" aria-hidden />
            <div className="pt-9 pb-4 px-4">
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={feature.title} className="h-full w-full object-cover" />
                ) : (
                  feature && <CoverArt book={feature} />
                )}
              </div>
              <div className="mt-3 text-center text-sm font-extrabold text-slate-900 truncate">
                {feature?.title}
              </div>
              <div className="text-center text-xs text-slate-400 truncate">{feature?.author}</div>
              {/* хуурамч плеер */}
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-blue-600" />
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-blue-600">
                <span className="text-lg" aria-hidden>⏮</span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-white text-lg" aria-hidden>▶</span>
                <span className="text-lg" aria-hidden>⏭</span>
              </div>
            </div>
          </div>
        </div>

        {/* номын эгнээ */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-extrabold text-slate-900">Шинэ нэмэгдсэн</div>
            <Link href="/catalog" className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap">
              Бүгдийг үзэх →
            </Link>
          </div>
          <div className="rail-scroll mt-3">
            {row.map((b) => (
              <BookCard key={b.id} book={b} className="w-[150px] md:w-[170px]" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
