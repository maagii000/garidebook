"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import BookCard from "@/components/BookCard";

export default function Home() {
  const { books, credit } = useStore();
  const featured = books.filter((b) => b.status === "active").slice(0, 8);

  return (
    <div>
      {/* HERO */}
      <section className="bg-navy text-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-sage animate-pulse" />
              UFE Entrepreneurship • Prototype / MVP
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight">
              Уншсан номоо оруул,
              <br />
              <span className="text-accent">кредит</span> цуглуул,
              <br />
              хямд ном ав.
            </h1>
            <p className="mt-4 text-white/75 leading-7 max-w-md">
              Сурагчид номын зургаа оруулаад +60~120 кредит авна. Цуглуулсан
              кредит + мөнгөөр (~5,000₮) ном хямд авч, солилцоно.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/books/new"
                className="rounded-xl bg-accent px-5 py-3 font-bold hover:bg-accent-dark"
              >
                📸 Ном оруулж кредит авах
              </Link>
              <Link
                href="/catalog"
                className="rounded-xl bg-white/10 px-5 py-3 font-bold hover:bg-white/20"
              >
                📚 Каталоги үзэх
              </Link>
            </div>
            <div className="mt-6 flex gap-6 text-sm">
              <div>
                <div className="text-2xl font-extrabold">{books.length}+</div>
                <div className="text-white/60">ном</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-accent">{credit}</div>
                <div className="text-white/60">таны кредит</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold">5,000₮</div>
                <div className="text-white/60">суурь үнэ</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <div className="font-bold mb-3">Хэрхэн ажилладаг вэ?</div>
            <ol className="space-y-3 text-sm">
              {[
                ["1", "Зураг оруул", "Ковер + ар + дотор тал. Нэр, зохиолч, төлөв (Шинэ/Шинэвтэр/Дунд/Ашигласан)."],
                ["2", "Кредит ав", "Пост нийтлэгдмэгц +60~120 кредит автоматаар. Өдөрт max 3."],
                ["3", "Хямд ав", "1 кредит = 10₮ хөнгөлөлт. 200 кредит = 2,000₮ хямд."],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-extrabold">{n}</span>
                  <span>
                    <span className="font-bold">{t}</span>
                    <br />
                    <span className="text-white/65">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="h-1.5 bg-accent" />
      </section>

      {/* UFE VALUE */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-extrabold text-navy">Яагаад Garidebook?</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["MORE GOOD ✨", "Хямд ном + уншаад урамшуулал + идэвхтэй уншлагын нийгэмлэг.", "bg-sage-light border-emerald-200"],
            ["LESS BAD 💡", "Шинэ номын өндөр зардал буурна, гэрт ашиглагддаггүй ном эргэлтэд орно.", "bg-accent-light border-orange-200"],
            ["TARGET 🎯", "ЕБС сурагч, оюутан, залуу уншигчдад зориулсан.", "bg-navy-light border-indigo-200"],
          ].map(([t, d, c]) => (
            <div key={t} className={`rounded-2xl border p-5 ${c}`}>
              <div className="font-extrabold">{t}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-navy">Онцлох номууд</h2>
          <Link href="/catalog" className="text-sm font-bold text-accent-dark hover:underline">
            Бүгдийг үзэх →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
