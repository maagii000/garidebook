"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { CountUp } from "@/components/Reveal";

function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M12 3v3m0 12v3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2M3 12h3m12 0h3M5.6 18.4l2.2-2.2m8.4-8.4 2.2-2.2" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

const NODES = [
  { href: "/hub", bg: "bg-emerald-500/10 text-emerald-600", label: "Файлууд", delay: "0s", reverse: false },
  { href: "/chat", bg: "bg-blue-500/10 text-brand", label: "Чат Хэсэг", delay: "-5s", reverse: true },
  { href: "/match", bg: "bg-purple-500/10 text-purple-600", label: "Түнш Хайх", delay: "-12s", reverse: false },
];

const FEATURES = [
  {
    href: "/hub",
    bg: "bg-brand/10 text-brand",
    title: "Материал заръя",
    text: "Сорил, лекцээ шүүж олж, өөрийн файлаа байршуулан орлого олох.",
    cta: "Үзэх",
  },
  {
    href: "/chat",
    bg: "bg-blue-500/10 text-blue-600",
    title: "Чат Хэсэг",
    text: "Бусад сурагчидтай шууд холбогдож, санал солилцох үнэгүй чат.",
    cta: "Чатлах",
  },
  {
    href: "/match",
    bg: "bg-purple-500/10 text-purple-600",
    title: "Хосоо ол",
    text: "Swipe загвараар хамт суралцах, төсөл хийх хамтрагчаа олох.",
    cta: "Хайх",
  },
];

export default function Hero({ bookCount }: { bookCount: number }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="hero-enter inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold tracking-wide">
            <SparklesIcon />
            <span>Сурагчдын ухаалаг хөгжих орчин</span>
          </div>
          <h1 className="hero-enter text-4xl sm:text-6xl font-extrabold tracking-tight text-black leading-[1.1]" style={{ "--hero-delay": "80ms" } as CSSProperties}>
            Илүү ухаалаг унш, <br /><span className="text-brand">Хамтдаа хэмнэ.</span>
          </h1>
          <p className="hero-enter text-lg text-slate-500 max-w-xl mx-auto lg:mx-0" style={{ "--hero-delay": "160ms" } as CSSProperties}>
            Уншсан номоо оруулаад кредит цуглуулж, хямд ном ав. Материал, чат, хамтрагч — бүхэн нэг дор.
          </p>
          <div className="hero-enter flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2" style={{ "--hero-delay": "240ms" } as CSSProperties}>
            <Link href="/catalog" className="px-7 py-3.5 rounded-full bg-brand text-white font-medium hover:bg-brand-dark shadow-lg transition-all flex items-center gap-2">
              <span>Хувь хүний хөгжил</span>
              <ArrowIcon />
            </Link>
            <Link href="/match" className="px-7 py-3.5 rounded-full bg-white border border-gray-200 text-black font-medium hover:border-brand transition-all shadow-sm">
              <span>Хосоо ол</span>
            </Link>
          </div>
          <div className="hero-enter grid grid-cols-3 gap-4 pt-8 border-t border-gray-200/60 max-w-lg mx-auto lg:mx-0" style={{ "--hero-delay": "320ms" } as CSSProperties}>
            <div>
              <div className="text-2xl font-bold text-black"><CountUp to={Math.max(bookCount, 0)} suffix="+" /></div>
              <div className="text-xs text-slate-500">Ном</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black"><CountUp to={120} prefix="+" /></div>
              <div className="text-xs text-slate-500">Кредит / ном</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black"><CountUp to={2000} prefix="−" suffix="₮" /></div>
              <div className="text-xs text-slate-500">Хямдрал</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex items-center justify-center relative min-h-[300px] md:min-h-[380px] overflow-hidden">
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-72 md:h-72 lg:w-80 lg:h-80 flex items-center justify-center scale-90 sm:scale-100">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-white to-[#F5F5F7] border border-gray-200 shadow-2xl flex flex-col items-center justify-center z-20 relative p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="font-extrabold text-sm tracking-tight text-black">LEVEL UP HUB</span>
              <span className="text-[10px] text-slate-500 font-medium">Credit Engine</span>
            </div>
            <div className="absolute inset-0 rounded-full border border-gray-200/40 animate-spin" style={{ animationDuration: "35s" }} />
            <div className="absolute -inset-8 rounded-full border border-dashed border-gray-200/60 animate-spin" style={{ animationDuration: "50s", animationDirection: "reverse" }} />
            {NODES.map((n) => (
              <div key={n.label} className={`absolute z-30 ${n.reverse ? "animate-orbit-reverse" : "animate-orbit"}`} style={{ animationDelay: n.delay }}>
                <Link href={n.href} className="bg-white border border-gray-200 shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2 hover:scale-105 transition-transform">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${n.bg}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <span className="text-xs font-semibold text-black">{n.label}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {FEATURES.map((f, i) => (
          <Link key={f.title} href={f.href}
            className="hero-enter glass-card p-8 rounded-3xl hover:border-brand transition-all cursor-pointer group"
            style={{ "--hero-delay": `${400 + i * 100}ms` } as CSSProperties}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.bg}`}>
              <span className="w-3 h-3 rounded-full bg-current" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">{f.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{f.text}</p>
            <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{f.cta}</span> <ChevronIcon />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
