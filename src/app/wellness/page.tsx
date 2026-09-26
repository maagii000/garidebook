"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Reveal, CountUp } from "@/components/Reveal";

// Инфографикаас: цаг → биеийн төлөв
const PHASES: { h: number; m: number; label: string; desc: string }[] = [
  { h: 0, m: 0, label: "Шөнө дунд", desc: "Нойрны мөчлөг идэвхтэй" },
  { h: 2, m: 0, label: "Хамгийн гүн нойр", desc: "Сэрээхэд хамгийн хэцүү үе" },
  { h: 4, m: 30, label: "Хамгийн нам температур", desc: "Бие амралтын гүнд" },
  { h: 6, m: 45, label: "Даралтын өсөлт", desc: "Сэрэх цаг дөхөж байна" },
  { h: 7, m: 30, label: "Мелатонин зогсоно", desc: "Өдөр эхэлж байна" },
  { h: 10, m: 0, label: "Хамгийн сэргэг", desc: "Анхаарал төвлөрөх оргил" },
  { h: 12, m: 0, label: "Үд дунд", desc: "Эрчим тогтвортой" },
  { h: 14, m: 30, label: "Хөдөлгөөний зохицол", desc: "Дасгалд тохиромжтой" },
  { h: 15, m: 30, label: "Хурдан хариу үйлдэл", desc: "Реакц хамгийн хурдан" },
  { h: 17, m: 0, label: "Булчингийн хүч", desc: "Хүчний дасгалд идеал" },
  { h: 18, m: 30, label: "Хамгийн өндөр даралт", desc: "Оройн идэвх" },
  { h: 19, m: 0, label: "Хамгийн өндөр температур", desc: "Бие дулаан" },
  { h: 21, m: 0, label: "Мелатонин эхэлнэ", desc: "Унтах бэлтгэл — дэлгэц холдуул" },
];

function phaseAt(date: Date) {
  const mins = date.getHours() * 60 + date.getMinutes();
  let cur = PHASES[0];
  for (const p of PHASES) {
    if (p.h * 60 + p.m <= mins) cur = p;
  }
  return cur;
}

const TIPS = [
  { t: "21:00 — дэлгэц унтраа", d: "Мелатонин ялгарч эхлэх үед утас барих нь нойрыг 40+ минутаар хойшлуулдаг." },
  { t: "Тогтмол цагт унт", d: "Амралтын өдрөөр ч ±30 минутаас хэтрүүлэхгүй байх нь хэмнэлийг тогтворжуулна." },
  { t: "Өглөө гэрэл ав", d: "07:30–10:00 хооронд нарны гэрэл — сэргэг байдлыг асаана." },
  { t: "Кофе 14:00-оос өмнө", d: "Кофеины хагас задрал 5–6 цаг — оройн нойронд нөлөөлнө." },
  { t: "Өрөө сэрүүн байлга", d: "18–20°C — биеийн температур буурахад нойр хүрдэг." },
  { t: "7–9 цаг зорь", d: "Сурагчдад ой тогтоолт нойрон дунд бэхждэг." },
];

interface Log {
  date: string;
  bedMin: number;
  wakeMin: number;
  quality: number;
  hours: number;
}

function toMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
function toStr(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function dayStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function WellnessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { notify, refreshAll } = useStore();
  const [plan, setPlan] = useState<string | null>(null);
  const [planChecked, setPlanChecked] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [streak, setStreak] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [date, setDate] = useState(() => dayStr(new Date()));
  const [bed, setBed] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const [quality, setQuality] = useState(4);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/membership")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setPlan(d?.membership?.plan ?? null);
        setPlanChecked(true);
      })
      .catch(() => setPlanChecked(true));
    fetch("/api/sleep")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setLogs(d.logs ?? []);
        setStreak(d.streak ?? 0);
        const t = (d.logs ?? []).find((l: Log) => l.date === dayStr(new Date()));
        if (t) {
          setBed(toStr(t.bedMin));
          setWake(toStr(t.wakeMin));
          setQuality(t.quality);
        }
      })
      .catch(() => {});
  }, [status]);

  const phase = useMemo(() => phaseAt(now), [now]);
  const nowDeg = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 360 + now.getSeconds() / 60;

  async function save() {
    setSaving(true);
    const r = await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, bedMin: toMin(bed), wakeMin: toMin(wake), quality }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { notify(d.error || "Алдаа", "err"); return; }
    notify(`${d.log.hours} цаг бүртгэгдлээ`);
    refreshAll(true);
    const l = await fetch("/api/sleep").then((x) => x.json()).catch(() => null);
    if (l) { setLogs(l.logs ?? []); setStreak(l.streak ?? 0); }
  }

  const loggedToday = logs.some((l) => l.date === dayStr(new Date()));

  if (status === "loading" || !planChecked) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-400">Ачааллаж байна...</div>;
  }
  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold text-black">Эхлээд нэвтэрнэ үү</h1>
        <button onClick={() => router.push("/login")} className="mt-5 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white">
          Нэвтрэх
        </button>
      </div>
    );
  }

  // Pro gate (mock pro-locked загвар)
  if (plan !== "PRO") {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="text-center mt-8 max-w-lg mx-auto bg-white border border-gray-200 p-10 rounded-[2rem] shadow-apple relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply blur-2xl opacity-50 -translate-y-1/2 translate-x-1/2" />
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 relative z-10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 relative z-10 text-black">Positive орчин</h2>
          <p className="text-slate-500 mb-8 leading-relaxed relative z-10 text-sm">
            Нойрны хэмнэл хянах, хувь хүний хөгжлийн контент <b>Pro</b> багцад нээгдэнэ.
          </p>
          <Link href="/membership" className="block w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all relative z-10">
            Pro эрх авах <span className="text-gray-400 font-normal">₮19,900</span>
          </Link>
          <Link href="/membership" className="mt-4 inline-block text-sm font-medium text-slate-500 hover:text-black transition-colors relative z-10">
            Багцуудтай танилцах
          </Link>
        </div>
      </div>
    );
  }

  const week = logs.slice(0, 7).reverse();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Reveal className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-black tracking-tight">Positive орчин</h2>
          <p className="text-sm text-slate-500 mt-1">Нойрны циркад хэмнэлээ хянаж, сэргэг бай</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-sm font-bold text-accent-dark w-fit">
          <CountUp to={streak} suffix=" өдөр дараалан" />
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {logs.length > 0 && !loggedToday && (
          <div className="lg:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-3.5 text-sm flex flex-wrap items-center gap-2">
            <span className="font-bold text-black">Өнөөдрийн нойроо бүртгээрэй.</span>
            <span className="text-slate-500">Доорх формоор 1 минутад.</span>
          </div>
        )}
        {/* Циркад цаг — dark wheel */}
        <Reveal className="rounded-[2rem] bg-[#0A1628] text-white p-6 md:p-8 relative overflow-hidden">
          <div className="text-xs font-extrabold uppercase tracking-widest text-white/50">Хоногийн хэмнэл — одоо</div>
          <div className="mt-1 text-2xl font-extrabold">{phase.label}</div>
          <div className="text-sm text-white/60">{phase.desc}</div>
          <div className="mt-4 flex justify-center">
            <svg viewBox="0 0 320 320" className="w-full max-w-[320px]">
              <circle cx="160" cy="160" r="150" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <circle cx="160" cy="160" r="118" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 6" />
              {PHASES.map((p) => {
                const a = ((p.h * 60 + p.m) / 1440) * Math.PI * 2 - Math.PI / 2;
                const x1 = 160 + Math.cos(a) * 118;
                const y1 = 160 + Math.sin(a) * 118;
                const x2 = 160 + Math.cos(a) * 150;
                const y2 = 160 + Math.sin(a) * 150;
                const lx = 160 + Math.cos(a) * 100;
                const ly = 160 + Math.sin(a) * 100;
                const hh = String(p.h).padStart(2, "0");
                const mm = p.m ? `:${String(p.m).padStart(2, "0")}` : "";
                return (
                  <g key={`${hh}${mm}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                    <circle cx={x1} cy={y1} r="3" fill="rgba(255,255,255,0.6)" />
                    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.75)" fontSize="10" fontWeight="700">
                      {hh}{mm}
                    </text>
                  </g>
                );
              })}
              {/* одоогийн цаг — зүү секунд тутамд зөөлөн гулсана */}
              <g style={{ transform: `rotate(${nowDeg}deg)`, transformOrigin: "160px 160px", transition: "transform 1s linear" }}>
                <line x1="160" y1="160" x2="160" y2="42" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="160" cy="42" r="6" fill="#F97316" />
                <circle cx="160" cy="42" r="10" fill="none" stroke="#F97316" strokeWidth="1" opacity="0.5" />
              </g>
              <circle cx="160" cy="160" r="52" fill="rgba(255,255,255,0.08)" />
              <text x="160" y="152" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">ХОНОГИЙН</text>
              <text x="160" y="170" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">ХЭМНЭЛ</text>
            </svg>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PHASES.filter((_, i) => i % 2 === 0).slice(0, 6).map((p) => (
              <div key={p.label} className="rounded-xl bg-white/5 px-3 py-2 text-[11px]">
                <span className="font-bold text-white/90">{String(p.h).padStart(2, "0")}{p.m ? `:${p.m}` : ":00"}</span>
                <span className="text-white/55"> — {p.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Нойр бүртгэл */}
        <div className="space-y-6">
          <Reveal className="glass-card rounded-3xl p-6 md:p-8">
            <h3 className="text-xl font-extrabold text-black">Өнөөдрийн нойр</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Унтсан</span>
                <input type="time" value={bed} onChange={(e) => setBed(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-[#F5F5F7] border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Сэрсэн</span>
                <input type="time" value={wake} onChange={(e) => setWake(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-[#F5F5F7] border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand" />
              </label>
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Чанар</span>
              <div className="mt-1.5 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setQuality(s)} aria-label={`${s} од`}
                    className={`text-2xl ${s <= quality ? "text-accent" : "text-gray-200"}`}>★</button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input type="date" value={date} max={dayStr(new Date())} onChange={(e) => setDate(e.target.value)}
                className="rounded-xl bg-[#F5F5F7] border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand" />
              <button onClick={save} disabled={saving}
                className="flex-1 rounded-xl bg-brand text-white py-2.5 text-sm font-bold hover:bg-brand-dark disabled:opacity-50">
                {saving ? "Хадгалж байна..." : "Бүртгэх"}
              </button>
            </div>
          </Reveal>

          <Reveal delay={100} className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xl font-extrabold text-black">Сүүлийн 7 хоног</h3>
              {week.length > 0 && (
                <span className="text-xs font-bold text-slate-500">
                  Дундаж {(week.reduce((s, l) => s + l.hours, 0) / week.length).toFixed(1)}ц
                </span>
              )}
            </div>
            {week.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Бүртгэл алга — дээрээс эхлээрэй.</p>
            ) : (
              <div className="mt-4 flex items-end gap-2 h-32">
                {week.map((l, i) => (
                  <div key={l.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">{l.hours}ц</span>
                    <div className="w-full rounded-lg bg-gray-100 relative" style={{ height: "100%" }}>
                      <div
                        className={`animate-bar-grow absolute bottom-0 w-full rounded-lg ${l.hours >= 7 && l.hours <= 9 ? "bg-emerald-500" : l.hours >= 5 ? "bg-brand" : "bg-red-400"}`}
                        style={{ height: `${Math.min(100, (l.hours / 10) * 100)}%`, animationDelay: `${i * 80}ms` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{l.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-400">Зорилт: 7–9 цаг (ногоон). Цэнхэр = бүртгэлтэй, улаан = дутуу.</p>
          </Reveal>
        </div>
      </div>

      <Reveal className="mt-6">
        <h3 className="text-xl font-extrabold text-black mb-4">Нойрны зөвлөмж</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {TIPS.map((t, i) => (
            <div key={t.t} className="glass-card rounded-3xl p-5 card-hover">
              <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand grid place-items-center text-sm font-extrabold">{i + 1}</div>
              <div className="mt-3 text-sm font-extrabold text-black">{t.t}</div>
              <p className="mt-1 text-[13px] leading-6 text-slate-500">{t.d}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
