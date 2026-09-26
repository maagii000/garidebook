"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import BookRail from "@/components/BookRail";
import { Reveal } from "@/components/Reveal";
import Hero from "@/components/home/Hero";
import StudioShowcase from "@/components/home/StudioShowcase";
import Testimonials from "@/components/home/Testimonials";
import AppDownload from "@/components/home/AppDownload";
import { Book } from "@/lib/types";
import { getRecent } from "@/lib/recent";

export default function Home() {
  const { books } = useStore();
  const { status } = useSession();
  const [recentIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : getRecent()
  );

  const active = useMemo(() => books.filter((b) => b.status === "active"), [books]);
  const fresh = useMemo(() => [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10), [active]);
  const p2p = useMemo(() => active.filter((b) => b.source !== "official").slice(0, 10), [active]);
  const official = useMemo(() => active.filter((b) => b.source === "official").slice(0, 10), [active]);
  const topRated = useMemo(() => [...active].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10), [active]);
  const recent = useMemo(
    () => recentIds
      .map((rid) => active.find((b) => b.id === rid))
      .filter((b): b is Book => !!b)
      .slice(0, 8),
    [recentIds, active]
  );

  // Rail давхардлыг арилгах: үзүүлсэн номоо дараагийн rail-д оруулахгүй
  const rails = useMemo(() => {
    const seen = new Set<string>();
    const pick = (list: Book[]) => {
      const out = list.filter((b) => !seen.has(b.id)).slice(0, 10);
      out.forEach((b) => seen.add(b.id));
      return out;
    };
    const rRecent = recent.filter((b) => !seen.has(b.id));
    rRecent.forEach((b) => seen.add(b.id));
    return {
      recent: rRecent,
      fresh: { total: fresh.length, books: pick(fresh) },
      p2p: { total: p2p.length, books: pick(p2p) },
      official: { total: official.length, books: pick(official) },
      top: { total: topRated.length, books: pick(topRated) },
    };
  }, [recent, fresh, p2p, official, topRated]);

  return (
    <div className="pb-10">
      {/* 0. Hero (Apple prototype) */}
      <Hero bookCount={active.length} />

      {/* 1. Студи showcase */}
      {active.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mt-3 text-lg font-extrabold text-slate-900">
              Одоогоор ном алга — эхнийх нь чийгээч?
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Тун удахгүй шинэ номууд нэмэгдэнэ.
            </p>
            <Link
              href="/catalog"
              className="mt-5 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-extrabold text-white hover:bg-accent-dark"
            >
              Каталоги үзэх
            </Link>
          </div>
        </div>
      ) : (
        <Reveal>
          <StudioShowcase books={fresh} />
        </Reveal>
      )}

      {/* 3. Rails */}
      <div className="mx-auto max-w-7xl px-4">
        {rails.recent.length > 0 && (
          <BookRail
            title="Саяхан үзсэн"
            subtitle="Үргэлжлүүлэн сонирхоорой"
            href="/catalog"
            books={rails.recent}
          />
        )}
        <BookRail
          title="Шинээр нэмэгдсэн"
          subtitle="Хамгийн сүүлд орсон номууд"
          href="/catalog"
          books={rails.fresh.books}
          totalCount={rails.fresh.total}
          badge="NEW"
        />
        <BookRail
          title="Сурагчдын P2P зарууд"
          subtitle="Хямд, эргэлтэд орсон номууд"
          href="/catalog"
          books={rails.p2p.books}
          totalCount={rails.p2p.total}
        />
        <BookRail
          title="Level Up Stock"
          subtitle="Албан ёсны баталгаат нөөц"
          href="/catalog"
          books={rails.official.books}
          totalCount={rails.official.total}
        />
        <BookRail
          title="Өндөр үнэлгээтэй"
          subtitle="Сурагчдын сэтгэгдлээр"
          href="/catalog"
          books={rails.top.books}
          totalCount={rails.top.total}
        />
      </div>

      {/* 4. Сэтгэгдэл */}
      <Reveal>
        <Testimonials />
      </Reveal>

      {/* Нойр CTA — нэвтэрсэн хэрэглэгчдэд */}
      {status === "authenticated" && (
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mt-10 rounded-[2rem] bg-[#0A1628] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden">
            <div className="flex-1">
              <div className="text-xs font-extrabold uppercase tracking-widest text-white/50">Positive орчин</div>
              <div className="mt-1 text-xl md:text-2xl font-extrabold">Өнөөдрийн нойроо бүртгэсэн үү?</div>
              <p className="mt-1 text-sm text-white/60">Циркад хэмнэлээ хянаарай.</p>
            </div>
            <Link href="/wellness" className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-black hover:bg-gray-100 text-center">
              Нойр бүртгэх →
            </Link>
          </Reveal>
        </div>
      )}

      {/* 5. Апп татах */}
      <Reveal>
        <AppDownload />
      </Reveal>

      {/* 6. Яагаад Level Up Hub? */}
      <div className="mx-auto max-w-7xl px-4">
        <Reveal as="section" className="mt-12">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">Яагаад Level Up Hub?</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Хямд ном", "Албан ёсны баталгаат нөөцөөс шууд аваарай.", "bg-emerald-50 border-emerald-100"],
              ["Мэдлэгээ тэл", "Сорил, лекцээ хуваалцаж орлого олоорой.", "bg-orange-50 border-orange-100"],
              ["Хамтдаа хөгж", "Чатлаж, хосоороо суралцаж, нойроо хянаарай.", "bg-indigo-50 border-indigo-100"],
            ].map(([t, d, c]) => (
              <div key={t} className={`rounded-2xl border p-5 bg-white ${c}`}>
                <div className="font-extrabold text-sm">{t}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
