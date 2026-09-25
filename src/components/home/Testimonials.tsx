"use client";

import { useRef } from "react";
import RatingStars from "@/components/RatingStars";

const ITEMS = [
  {
    name: "Сараа",
    role: "Сурагч",
    rating: 5,
    title: "Сэтгэгдэл 1",
    text: "Уншсан номоо оруулаад шууд кредит авсан. Хямд үнээр дараагийн номоо авсан — маш амархан!",
    avatar: "С",
    color: "bg-rose-500",
  },
  {
    name: "Амараа",
    role: "Оюутан",
    rating: 5,
    title: "Сэтгэгдэл 2",
    text: "P2P зар оруулаад 2 хоногт кредит орсон. Сурах бичгээ хямд авсан, эргэлтэд оруулсан.",
    avatar: "А",
    color: "bg-blue-600",
  },
  {
    name: "Мөнхсайхан",
    role: "Хэрэглэгч",
    rating: 4,
    title: "Сэтгэгдэл 3",
    text: "Калькулятор нь хэр хямдрахыг шууд харуулдаг нь таалагдсан. Stock номууд баталгаатай.",
    avatar: "М",
    color: "bg-emerald-600",
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <section className="mt-14 bg-[#f2f7ff] border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-center text-xl md:text-2xl font-extrabold text-slate-900">
          Хэрэглэгчдийн <span className="text-slate-400">сэтгэгдэл</span>
        </h2>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="өмнөх"
            className="hidden md:grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            ←
          </button>
          <div ref={ref} className="rail-scroll flex-1 !m-0 !p-0">
            {ITEMS.map((t) => (
              <article
                key={t.title}
                className="w-[300px] md:w-[340px] shrink-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <RatingStars value={t.rating} />
                <div className="mt-2 text-sm font-extrabold text-slate-900">{t.title}</div>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-500">{t.text}</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${t.color} text-white text-sm font-extrabold`}>
                    {t.avatar}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button
            onClick={() => scrollBy(1)}
            aria-label="дараах"
            className="hidden md:grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
