"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import BookRail from "@/components/BookRail";
import { CREDIT_TO_MNT, MAX_CREDIT_USE_PER_ORDER } from "@/lib/types";

export default function Home() {
  const { books, credit } = useStore();
  const { status } = useSession();
  const [calcCredit, setCalcCredit] = useState(200);

  const active = useMemo(() => books.filter((b) => b.status === "active"), [books]);
  const fresh = useMemo(() => [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10), [active]);
  const official = useMemo(() => active.filter((b) => b.source === "official").slice(0, 10), [active]);
  const p2p = useMemo(() => active.filter((b) => b.source !== "official").slice(0, 10), [active]);
  const topRated = useMemo(() => [...active].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10), [active]);
  const textbook = useMemo(() => active.filter((b) => b.category === "textbook").slice(0, 10), [active]);
  const fiction = useMemo(() => active.filter((b) => b.category === "fiction").slice(0, 10), [active]);
  const cheapWithCredit = useMemo(
    () => [...active].sort((a, b) => a.priceCash - MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT - (b.priceCash - MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT)).slice(0, 10),
    [active]
  );

  const calcDiscount = Math.min(calcCredit, MAX_CREDIT_USE_PER_ORDER) * CREDIT_TO_MNT;
  const calcFinal = Math.max(0, 5000 - calcDiscount);

  return (
    <div className="pb-10">
      {/* HERO — compact + кредит калькулятор */}
      <section className="bg-navy text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14 grid gap-8 md:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              UFE Entrepreneurship • Prototype / MVP
            </div>
            <h1 className="mt-4 text-3xl md:text-[44px] font-extrabold leading-[1.15]">
              Уншсан номоо оруул,
              <br />
              <span className="text-accent">кредит</span> цуглуул,
              <br />
              хямд ном ав.
            </h1>
            <p className="mt-4 text-white/70 leading-7 max-w-md text-[15px]">
              Сурагчид номын зургаа оруулаад +60~120 кредит авна.
              1 кредит = 10₮ хөнгөлөлт. Суурь үнэ 5,000₮.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/books/new"
                className="rounded-full bg-accent px-6 py-3 text-sm font-extrabold text-white hover:bg-accent-dark transition shadow-lg shadow-orange-900/30"
              >
                📸 Ном оруулж кредит авах
              </Link>
              <Link
                href="/catalog"
                className="rounded-full bg-white/10 px-6 py-3 text-sm font-extrabold hover:bg-white/20 transition"
              >
                📚 Каталоги үзэх
              </Link>
            </div>
            <div className="mt-6 flex gap-8 text-sm">
              <div>
                <div className="text-2xl font-extrabold">{books.length}+</div>
                <div className="text-white/55 text-xs mt-0.5">ном</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-accent">
                  {status === "authenticated" ? credit : "+120"}
                </div>
                <div className="text-white/55 text-xs mt-0.5">
                  {status === "authenticated" ? "таны кредит" : "нэвтрээд авах"}
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">5,000₮</div>
                <div className="text-white/55 text-xs mt-0.5">суурь үнэ</div>
              </div>
            </div>
          </div>

          {/* Кредит калькулятор card */}
          <div className="rounded-3xl bg-white text-slate-900 p-6 shadow-2xl">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Кредит калькулятор
            </div>
            <div className="mt-1 text-lg font-extrabold">
              {calcCredit} кредит = −{calcDiscount.toLocaleString()}₮
            </div>
            <input
              type="range"
              min={0}
              max={400}
              step={10}
              value={calcCredit}
              onChange={(e) => setCalcCredit(Number(e.target.value))}
              className="credit-range mt-4 w-full"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400 font-bold">
              <span>0</span>
              <span>max 200кр / захиалга</span>
              <span>400</span>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 line-through">5,000₮</div>
                <div className="text-2xl font-extrabold text-navy">
                  {calcFinal.toLocaleString()}₮
                </div>
              </div>
              <Link
                href="/catalog"
                className="rounded-full bg-navy px-4 py-2.5 text-xs font-extrabold text-white hover:bg-navy-dark"
              >
                Энэ үнээр авах →
              </Link>
            </div>
            <div className="mt-4 space-y-2 text-[13px]">
              {[
                ["1", "Зураг оруул", "+60~120кр"],
                ["2", "Кредит ав", "өдөрт max 3"],
                ["3", "Хямд ав", "кр + мөнгө"],
              ].map(([n, t, d]) => (
                <div key={n} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-white text-xs font-extrabold">{n}</span>
                  <span className="font-bold">{t}</span>
                  <span className="ml-auto text-xs font-bold text-emerald-600">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-accent" />
      </section>

      {/* RAILS */}
      <div className="mx-auto max-w-7xl px-4">
        {active.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-5xl">📚</div>
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
              📸 Эхний номоо оруулах
            </Link>
          </div>
        ) : (
          <>
            <BookRail
              title="Шинээр нэмэгдсэн"
              subtitle="Хамгийн сүүлд орсон P2P + Stock зарууд"
              href="/catalog"
              books={fresh}
              badge="NEW"
            />
            <BookRail
              title="Кредитээр хамгийн хямд"
              subtitle={`200кр ашиглавал −${(MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT).toLocaleString()}₮ хямдарна`}
              href="/catalog"
              books={cheapWithCredit}
              badge="−2,000₮"
            />
          </>
        )}

        {/* Цэнхэр promo strip — Mbook маяг */}
        <section className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">
                Garidebook Stock
              </div>
              <div className="mt-1 text-2xl md:text-3xl font-extrabold leading-tight">
                Суурь 5,000₮ → кредитээр 3,000₮
              </div>
              <p className="mt-2 text-sm text-white/70 max-w-md leading-6">
                Албан ёсны нөөцөөс шууд ав. P2P хүлээлтгүй, баталгаатай төлөв.
              </p>
              <Link
                href="/catalog"
                className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-blue-800 hover:bg-blue-50"
              >
                Stock үзэх →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-6 text-center w-full md:w-auto">
              {[
                ["60–120", "ном оруулахад"],
                ["10₮", "1 кредит ="],
                ["200кр", "max / захиалга"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/10 px-2 py-3 md:px-5 md:py-4 md:min-w-[110px]">
                  <div className="text-base md:text-xl font-extrabold whitespace-nowrap">{v}</div>
                  <div className="mt-0.5 text-[10px] md:text-[11px] text-white/65 leading-tight">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BookRail
          title="Сурагчдын P2P зарууд"
          subtitle="Хямд, эргэлтэд орсон номууд"
          href="/catalog"
          books={p2p}
        />
        <BookRail
          title="Garidebook Stock"
          subtitle="Албан ёсны баталгаат нөөц"
          href="/catalog"
          books={official}
        />
        <BookRail
          title="Өндөр үнэлгээтэй"
          subtitle="Сурагчдын сэтгэгдлээр"
          href="/catalog"
          books={topRated}
        />
        <BookRail title="Сурах бичиг" href="/catalog" books={textbook} />
        <BookRail title="Уран зохиол" href="/catalog" books={fiction} />

        {/* Яагаад Garidebook */}
        <section className="mt-12">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">Яагаад Garidebook?</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["MORE GOOD ✨", "Хямд ном + уншаад урамшуулал + идэвхтэй уншлагын нийгэмлэг.", "bg-emerald-50 border-emerald-100"],
              ["LESS BAD 💡", "Шинэ номын өндөр зардал буурна, гэрт ашиглагддаггүй ном эргэлтэд орно.", "bg-orange-50 border-orange-100"],
              ["TARGET 🎯", "ЕБС сурагч, оюутан, залуу уншигчдад зориулсан.", "bg-indigo-50 border-indigo-100"],
            ].map(([t, d, c]) => (
              <div key={t} className={`rounded-2xl border p-5 bg-white ${c}`}>
                <div className="font-extrabold text-sm">{t}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
