"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import PayModal from "@/components/PayModal";
import { Reveal } from "@/components/Reveal";
import { MEMBERSHIP_PRICES, type MembershipPlan } from "@/lib/payments";

function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3m0 12v3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2M3 12h3m12 0h3M5.6 18.4l2.2-2.2m8.4-8.4 2.2-2.2" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function CheckCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const BASE_PERKS = [
  { ok: true, text: "Материал зарах, татах" },
  { ok: true, text: "Оюутны чат хэсэгт чөлөөт оролцоо" },
  { ok: true, text: "Файл байршуулж орлого олох эрх" },
  { ok: false, text: "VIP Business Partner match" },
];

const PRO_PERKS = [
  { ok: true, text: "Base багцын бүх эрх" },
  { ok: true, text: "Study & Business VIP Match" },
  { ok: true, text: "Оюутны зар оруулах, харах" },
  { ok: true, text: "Онцгой тэмдэг (Pro badge)" },
];

export default function MembershipPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { notify } = useStore();
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [firstTimer, setFirstTimer] = useState(false);
  const [payFor, setPayFor] = useState<MembershipPlan | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/membership")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setPlan(d.membership?.plan ?? null);
        setEndsAt(d.membership?.endsAt ?? null);
        setFirstTimer(!!d.firstTimer);
      })
      .catch(() => {});
  };
  useEffect(() => { if (session) load(); }, [session]);

  async function claimTrial(p: MembershipPlan) {
    setBusy(true);
    const r = await fetch("/api/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: p, trial: true }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { notify(d.error || "Алдаа", "err"); return; }
    notify("Эхний сар үнэгүй идэвхжлээ");
    load();
  }

  async function confirmPaid(p: MembershipPlan, paymentId: string) {
    const r = await fetch("/api/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: p, paymentId }),
    });
    const d = await r.json();
    if (!r.ok) { notify(d.error || "Алдаа", "err"); return; }
    notify(`${p} эрх идэвхжлээ`);
    setPayFor(null);
    load();
  }

  const price = (p: MembershipPlan) => MEMBERSHIP_PRICES[p].toLocaleString();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-20">
      <Reveal className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .7-1c2.7-.8 5.2-2 7.3-3.5a1 1 0 0 1 1.2 0c2 1.5 4.5 2.7 7.1 3.5a1 1 0 0 1 .7 1Z" /><path d="m9 12 2 2 4-4" /></svg>
          <span>Ил тод гишүүнчлэлийн төлөвлөгөө</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">Өөрт тохирох багцаа сонгоно уу</h2>
        <p className="text-slate-500 text-sm sm:text-base">Сурагчдад зориулсан хамгийн хямд бөгөөд үр дүнтэй гишүүнчлэл</p>
        <div className="inline-flex bg-[#F5F5F7] p-1 rounded-full text-sm font-medium">
          <span className="px-4 py-2 rounded-full bg-white shadow-sm text-black">
            Одоогийн төлөв: <span className="font-bold text-brand">{plan === "PRO" ? "Full Access" : plan ?? "Багцгүй"}</span>
            {endsAt && <span className="text-slate-400"> • {String(endsAt).slice(0, 10)} хүртэл</span>}
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Base */}
        <Reveal delay={80} className="glass-card rounded-3xl p-8 flex flex-col justify-between hover:border-brand transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand/10 text-brand text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Base Tier</span>
              <h3 className="text-2xl font-extrabold text-black mt-1">Үндсэн гишүүнчлэл</h3>
              <p className="text-xs text-slate-500 mt-1">Анхан болон дунд түвшний сурагчдад зориулав.</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-black">₮{price("BASE")}</span>
              <span className="text-xs text-slate-500">/ сар</span>
            </div>
            {firstTimer && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 text-xs font-medium">
                Эхний сар үнэгүй турших боломжтой!
              </div>
            )}
            <ul className="space-y-3 text-sm text-black">
              {BASE_PERKS.map((f) => (
                <li key={f.text} className={`flex items-center gap-3 ${f.ok ? "text-black" : "text-gray-400"}`}>
                  {f.ok ? <CheckCircleIcon className="text-brand shrink-0" /> : <XIcon className="shrink-0" />}
                  <span className={f.ok ? "" : "line-through"}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-8">
          {plan === "BASE" ? (
            <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-center">Идэвхтэй байна</div>
          ) : firstTimer ? (
            <button onClick={() => claimTrial("BASE")} disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-black font-semibold hover:border-brand transition-all shadow-sm disabled:opacity-50">
              {busy ? "Идэвхжүүлж байна..." : "Эхний сар үнэгүй турших"}
            </button>
          ) : (
            <button
              onClick={() => { if (!session) { router.push("/login"); return; } setPayFor("BASE"); }}
              className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-black font-semibold hover:border-brand transition-all shadow-sm">
              Base эрх авах
            </button>
          )}
          </div>
        </Reveal>

        {/* Full Access */}
        <Reveal delay={160} className="glass-card rounded-3xl p-8 flex flex-col justify-between border-2 border-brand shadow-xl relative overflow-hidden bg-gradient-to-b from-white to-brand/5">
          <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">FULL ACCESS</div>
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Full Access Tier</span>
              <h3 className="text-2xl font-extrabold text-black mt-1">Бүтэн эрхтэй гишүүн</h3>
              <p className="text-xs text-slate-500 mt-1">Бүх боломж, VIP түншлэл, хязгааргүй материал.</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-black">₮{price("PRO")}</span>
              <span className="text-xs text-slate-500">/ сар</span>
            </div>
            <div className="p-3 rounded-2xl bg-brand/10 text-brand text-xs font-medium">
              Бүх үйлчилгээ хязгааргүй ашиглах
            </div>
            <ul className="space-y-3 text-sm text-black">
              {PRO_PERKS.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <CheckCircleIcon className="text-brand shrink-0" />
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-8">
          {plan === "PRO" ? (
            <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-center">Идэвхтэй байна</div>
          ) : firstTimer ? (
            <button onClick={() => claimTrial("PRO")} disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-brand text-white font-semibold hover:bg-brand-dark shadow-md transition-all disabled:opacity-50">
              {busy ? "Идэвхжүүлж байна..." : "Эхний сар үнэгүй турших"}
            </button>
          ) : (
            <button
              onClick={() => { if (!session) { router.push("/login"); return; } setPayFor("PRO"); }}
              className="w-full py-3.5 rounded-2xl bg-brand text-white font-semibold hover:bg-brand-dark shadow-md transition-all">
              Full Access авах
            </button>
          )}
          </div>
        </Reveal>
      </div>

      {!session && (
        <p className="mt-8 text-center text-sm text-slate-500">
          Багц авахын тулд эхлээд{" "}
          <button onClick={() => router.push("/login")} className="font-bold text-brand hover:underline">
            нэвтэрнэ үү
          </button>
          .
        </p>
      )}

      {payFor && (
        <PayModal
          title={`${payFor} багц — 30 хоног`}
          amount={MEMBERSHIP_PRICES[payFor]}
          description={`LevelUp: ${payFor} гишүүнчлэл`}
          purpose="MEMBERSHIP"
          onPaid={(pid) => { setPayFor(null); confirmPaid(payFor, pid); }}
          onClose={() => setPayFor(null)}
        />
      )}
    </div>
  );
}
