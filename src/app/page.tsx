"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import BookRail from "@/components/BookRail";
import { Reveal } from "@/components/Reveal";
import StudioShowcase from "@/components/home/StudioShowcase";
import CreditService from "@/components/home/CreditService";
import Testimonials from "@/components/home/Testimonials";
import AppDownload from "@/components/home/AppDownload";
import { Book, CREDIT_TO_MNT, MAX_CREDIT_USE_PER_ORDER } from "@/lib/types";
import { getRecent } from "@/lib/recent";

export default function Home() {
  const { books } = useStore();
  const [recentIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : getRecent()
  );

  const active = useMemo(() => books.filter((b) => b.status === "active"), [books]);
  const fresh = useMemo(() => [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10), [active]);
  const p2p = useMemo(() => active.filter((b) => b.source !== "official").slice(0, 10), [active]);
  const official = useMemo(() => active.filter((b) => b.source === "official").slice(0, 10), [active]);
  const topRated = useMemo(() => [...active].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10), [active]);
  const cheapWithCredit = useMemo(
    () => [...active].sort((a, b) => a.priceCash - MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT - (b.priceCash - MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT)).slice(0, 10),
    [active]
  );
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
      cheap: { total: cheapWithCredit.length, books: pick(cheapWithCredit) },
      p2p: { total: p2p.length, books: pick(p2p) },
      official: { total: official.length, books: pick(official) },
      top: { total: topRated.length, books: pick(topRated) },
    };
  }, [recent, fresh, cheapWithCredit, p2p, official, topRated]);

  return (
    <div className="pb-10">
      {/* 1. Студи showcase */}
      {active.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mt-3 text-lg font-extrabold text-slate-900">
              Одоогоор ном алга — эхнийх нь чийгээч?
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Номын зургаа оруулаад шууд +60~120 кредит авна.
            </p>
            <Link
              href="/books/new"
              className="mt-5 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-extrabold text-white hover:bg-accent-dark"
            >
              Эхний номоо оруулах
            </Link>
          </div>
        </div>
      ) : (
        <Reveal>
          <StudioShowcase books={fresh} />
        </Reveal>
      )}

      {/* 2. Кредит үйлчилгээ */}
      <Reveal>
        <CreditService />
      </Reveal>

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
          title="Кредитээр хамгийн хямд"
          subtitle={`200кр ашиглавал −${(MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT).toLocaleString()}₮ хямдарна`}
          href="/catalog"
          books={rails.cheap.books}
          totalCount={rails.cheap.total}
          badge="−2,000₮"
        />
        <BookRail
          title="Сурагчдын P2P зарууд"
          subtitle="Хямд, эргэлтэд орсон номууд"
          href="/catalog"
          books={rails.p2p.books}
          totalCount={rails.p2p.total}
        />
        <BookRail
          title="Garidebook Stock"
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

      {/* 5. Апп татах */}
      <Reveal>
        <AppDownload />
      </Reveal>

      {/* 6. Яагаад Garidebook? */}
      <div className="mx-auto max-w-7xl px-4">
        <Reveal as="section" className="mt-12">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">Яагаад Garidebook?</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Хямд ав", "Суурь 5,000₮ — кредитээр 3,000₮ хүртэл хямдарна.", "bg-emerald-50 border-emerald-100"],
              ["Кредит цуглуул", "Уншсан номоо оруулаад +60~120 кредит авна.", "bg-orange-50 border-orange-100"],
              ["Солилцож эргэлтэд оруул", "Гэрт ашиглагддаггүй номоо сурагчдад хүргэ.", "bg-indigo-50 border-indigo-100"],
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
