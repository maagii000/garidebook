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
  { ok: true, text: "Мэдлэгийн сан (материал авах/зарах)" },
  { ok: true, text: "Номын каталог + P2P солилцоо" },
  { ok: true, text: "Кредит данс + хямдрал" },
  { ok: false, text: "Нойр & Хувь хүний хөгжил" },
  { ok: false, text: "Оюутны зар, маркетплейс" },
];

const PRO_PERKS = [
  { ok: true, text: "Base багцын бүх эрх" },
  { ok: true, text: "Нойрны хэмнэл & Хувь хүний хөгжил" },
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
      <Reveal className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-brand font-semibold tracking-wider uppercase text-xs mb-2 block">Garidebook</span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black">Өөрт тохирох багцаа сонгоно уу.</h1>
        <p className="text-slate-500 text-lg">Сурагчдад зориулсан мэдлэг, солилцоо, хөгжлийн нэгдсэн систем.</p>
        <div className="mt-6 inline-flex bg-[#F4F4F5] p-1 rounded-full text-sm font-medium">
          <span className="px-4 py-2 rounded-full bg-white shadow-sm text-black">
            Одоогийн төлөв: <span className="font-bold text-brand">{plan ?? "Багцгүй"}</span>
            {endsAt && <span className="text-slate-400"> • {String(endsAt).slice(0, 10)} хүртэл</span>}
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Base */}
        <Reveal delay={80} className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 flex flex-col relative overflow-hidden">
          {firstTimer && (
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
              Эхний сар 100% ҮНЭГҮЙ
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2 text-black">Base</h3>
          <p className="text-slate-500 text-sm mb-6">Солилцоо болон харилцаанд шаардлагатай суурь эрх.</p>
          <div className="mb-8">
            <span className="text-4xl font-bold text-black">₮{price("BASE")}</span>
            <span className="text-slate-500"> / сар</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            {BASE_PERKS.map((f) => (
              <li key={f.text} className={`flex items-center gap-3 ${f.ok ? "text-black" : "text-gray-400"}`}>
                {f.ok ? <CheckCircleIcon className="text-green-500 shrink-0" /> : <XIcon className="shrink-0" />}
                {f.text}
              </li>
            ))}
          </ul>
          {plan === "BASE" ? (
            <div className="w-full bg-gray-100 text-gray-400 py-4 rounded-full font-bold text-center">Идэвхтэй байна</div>
          ) : firstTimer ? (
            <button onClick={() => claimTrial("BASE")} disabled={busy}
              className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
              {busy ? "Идэвхжүүлж байна..." : "Үнэгүй эхлэх"}
            </button>
          ) : (
            <button
              onClick={() => { if (!session) { router.push("/login"); return; } setPayFor("BASE"); }}
              className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-colors">
              Base эрх авах
            </button>
          )}
        </Reveal>

        {/* Pro */}
        <Reveal delay={160} className="bg-black text-white rounded-[2rem] p-8 shadow-apple-hover border border-gray-800 flex flex-col relative">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-brand to-blue-400 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-lg">
            Хамгийн эрэлттэй
          </div>
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <p className="text-gray-400 text-sm mb-6">Өөрийгөө хөгжүүлж, боломжуудыг бүрэн ашиглах.</p>
          <div className="mb-8">
            <span className="text-4xl font-bold">₮{price("PRO")}</span>
            <span className="text-gray-400"> / сар</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            {PRO_PERKS.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <CheckCircleIcon className="text-brand shrink-0" />
                {f.text}
              </li>
            ))}
          </ul>
          {plan === "PRO" ? (
            <div className="w-full bg-gray-800 text-gray-400 py-4 rounded-full font-bold text-center">Идэвхтэй байна</div>
          ) : firstTimer ? (
            <button onClick={() => claimTrial("PRO")} disabled={busy}
              className="w-full bg-brand text-white py-4 rounded-full font-bold hover:bg-brand-dark transition-colors shadow-lg disabled:opacity-50">
              {busy ? "Идэвхжүүлж байна..." : "Үнэгүй эхлэх"}
            </button>
          ) : (
            <button
              onClick={() => { if (!session) { router.push("/login"); return; } setPayFor("PRO"); }}
              className="w-full bg-brand text-white py-4 rounded-full font-bold hover:bg-brand-dark transition-colors shadow-lg">
              Pro эрх авах
            </button>
          )}
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
          description={`Garidebook: ${payFor} гишүүнчлэл`}
          purpose="MEMBERSHIP"
          onPaid={(pid) => { setPayFor(null); confirmPaid(payFor, pid); }}
          onClose={() => setPayFor(null)}
        />
      )}
    </div>
  );
}
