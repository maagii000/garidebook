"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import RatingStars from "@/components/RatingStars";

interface Item {
  id: string;
  rating: number;
  text: string;
  bookId: string;
  bookTitle: string;
  userName: string;
}

const AVATAR_COLORS = ["bg-rose-500", "bg-blue-600", "bg-emerald-600", "bg-amber-500", "bg-violet-600"];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/reviews?take=6")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.reviews)) setItems(d.reviews); })
      .catch(() => {});
  }, []);

  // Auto-rotate 5с тутамд (hover/touch үед түр зогсоно)
  useEffect(() => {
    if (items.length < 2) return;
    let paused = false;
    const el = ref.current;
    if (!el) return;
    const onDown = () => { paused = true; };
    const onUp = () => { paused = false; };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("mouseenter", onDown);
    el.addEventListener("mouseleave", onUp);
    const t = setInterval(() => {
      if (paused) return;
      const max = el.scrollWidth - el.clientWidth - 8;
      if (el.scrollLeft >= max) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 340, behavior: "smooth" });
      }
    }, 5000);
    return () => {
      clearInterval(t);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("mouseenter", onDown);
      el.removeEventListener("mouseleave", onUp);
    };
  }, [items.length]);

  // Жинхэнэ ревью байхгүй бол блок нуугддаг (хуурамч сэтгэгдэл байхгүй)
  if (items.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <section className="mt-14 bg-[#f2f7ff] border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-center text-xl md:text-2xl font-extrabold text-slate-900">
          Уншигчдын <span className="text-slate-400">сэтгэгдэл</span>
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
            {items.map((t, i) => (
              <article
                key={t.id}
                className="w-[300px] md:w-[340px] shrink-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <RatingStars value={t.rating} />
                <p className="mt-2 text-[13px] leading-6 text-slate-600 clamp-2 min-h-[3.9em]">“{t.text}”</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-sm font-extrabold`}>
                    {t.userName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{t.userName}</div>
                    <Link href={`/books/${t.bookId}`} className="block text-[11px] text-blue-600 truncate hover:underline">
                      {t.bookTitle}
                    </Link>
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
