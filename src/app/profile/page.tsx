"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import BookCard from "@/components/BookCard";

type Tab = "intro" | "saved" | "orders" | "member";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { orders, wishlistBooks, loading, notify } = useStore();
  const [tab, setTab] = useState<Tab>("intro");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState<"study" | "business">("study");
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [firstTimer, setFirstTimer] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.me) return;
        setNickname(d.me.nickname ?? "");
        setBio(d.me.bio ?? "");
        setSchool(d.me.school ?? "");
        setInterests(d.me.interests ?? "");
        setLookingFor(d.me.lookingFor === "business" ? "business" : "study");
      })
      .catch(() => {});
    fetch("/api/membership")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setPlan(d.membership?.plan ?? null);
        setEndsAt(d.membership?.endsAt ?? null);
        setFirstTimer(!!d.firstTimer);
      })
      .catch(() => {});
    fetch("/api/sleep")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStreak(d.streak ?? 0); })
      .catch(() => {});
  }, [status]);

  async function saveProfile() {
    setSaving(true);
    const r = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, bio, school, interests, lookingFor }),
    });
    setSaving(false);
    if (!r.ok) { notify("Хадгалах үед алдаа", "err"); return; }
    notify("Танилцуулга хадгалагдлаа");
  }

  if (status === "loading") {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-500">Ачааллаж байна...</div>;
  }
  if (!session?.user) {
    return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Эхлээд нэвтэрнэ үү</h1>
        <Link href="/login" className="mt-5 inline-block rounded-xl bg-navy px-6 py-3 font-bold text-white">
          Нэвтрэх
        </Link>
      </div>
    );
  }

  const name = session.user.name ?? session.user.email ?? "Хэрэглэгч";
  const displayName = nickname.trim() || name;
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";

  const tabs: { v: Tab; label: string; count?: number }[] = [
    { v: "intro", label: "Танилцуулга" },
    { v: "saved", label: "Хадгалсан", count: wishlistBooks.length },
    { v: "orders", label: "Захиалгууд", count: orders.length },
    { v: "member", label: "Гишүүнчлэл" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero — цагаан glass */}
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 md:p-8 shadow-apple flex flex-col md:flex-row md:items-center gap-5">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand text-2xl font-extrabold">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-black truncate">
            {displayName}
            {plan === "PRO" && (
              <span className="ml-2 align-middle rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                PRO
              </span>
            )}
          </h1>
          <div className="text-slate-500 text-sm truncate">{session.user.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {isAdmin && (
              <Link href="/admin" className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                Админ
              </Link>
            )}
            {plan && plan !== "PRO" && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-slate-600">
                {plan} • {endsAt ? String(endsAt).slice(0, 10) : ""} хүртэл
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
          {[
            ["Хадгалсан", wishlistBooks.length],
            ["Захиалга", orders.length],
            ["Streak", `${streak}өд`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-[#F5F5F7] border border-gray-100 px-4 py-3">
              <div className="text-xl font-extrabold text-black">{v}</div>
              <div className="text-[11px] text-slate-500 font-bold">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Таб */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all ${
              tab === t.v ? "bg-brand text-white shadow-sm" : "bg-white text-slate-600 border border-gray-200"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${tab === t.v ? "bg-white/20" : "bg-gray-100"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "intro" && (
        <div className="mt-4 rounded-[2rem] border border-gray-100 bg-white p-5 md:p-6 shadow-apple">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold text-black">Миний танилцуулга</h2>
            <Link href="/match" className="text-xs font-bold text-brand hover:underline">Хосоо ол →</Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Хосоо ол хэсэгт ингэж харагдана. Утас, имэйл хэзээ ч харагдахгүй.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Нэр (nickname)</span>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ж: Сараа"
                className="mt-1.5 w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Сургууль</span>
              <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="ж: СЭЗИС, 2-р курс"
                className="mt-1.5 w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Танилцуулга</span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Юу хайж байна?"
                className="mt-1.5 w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Сонирхол (таслалаар)</span>
              <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="ж: Хөгжүүлэгч, Дизайн, Математик"
                className="mt-1.5 w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-black" />
            </label>
            <div className="md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Хайж буй хамтрагч</span>
              <div className="mt-1.5 flex gap-2">
                {(["study", "business"] as const).map((m) => (
                  <button key={m} onClick={() => setLookingFor(m)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      lookingFor === m ? "bg-brand text-white shadow-sm" : "bg-white text-black border border-gray-200"
                    }`}>
                    {m === "study" ? "Study Partner" : "Business Partner"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="mt-4 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      )}

      {tab === "saved" && (
        <div id="wishlist" className="mt-4 rounded-3xl border bg-white p-5 scroll-mt-24">
          <h2 className="font-extrabold text-black">Хадгалсан номууд ({wishlistBooks.length})</h2>
          {loading ? (
            <div className="mt-3 text-sm text-slate-500">Ачааллаж байна...</div>
          ) : wishlistBooks.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed bg-paper p-8 text-center text-sm text-slate-500">
              Хадгалсан ном алга.
              <Link href="/catalog" className="ml-2 font-bold text-brand hover:underline">Ном үзэх →</Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistBooks.map((b) => (
                <BookCard key={b.id} book={b} className="w-full" />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-4 rounded-3xl border bg-white p-5">
          <h2 className="font-extrabold text-black">Миний захиалгууд ({orders.length})</h2>
          <div className="mt-3 space-y-2 max-h-80 overflow-auto">
            {orders.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-paper p-6 text-center text-sm text-slate-500">
                Захиалга байхгүй.
                <Link href="/catalog" className="ml-2 font-bold text-brand hover:underline">Ном үзэх →</Link>
              </div>
            )}
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
                <div className="font-bold">{o.bookTitle}</div>
                <div className="text-xs text-slate-500">
                  {o.cashPaid.toLocaleString()}₮ • {String(o.createdAt).slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "member" && (
        <div className="mt-4 rounded-3xl border bg-white p-5 md:p-6">
          <h2 className="font-extrabold text-black">Гишүүнчлэл</h2>
          {plan ? (
            <div className="mt-3 rounded-2xl bg-[#F5F5F7] border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="text-lg font-extrabold text-black">
                  {plan === "PRO" ? "Full Access" : plan}
                  {plan === "PRO" && (
                    <span className="ml-2 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-extrabold text-white">PRO</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {endsAt ? `${String(endsAt).slice(0, 10)} хүртэл идэвхтэй` : "Идэвхтэй"}
                </div>
              </div>
              <Link href="/membership" className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white text-center hover:bg-gray-800">
                Сунгах / солих
              </Link>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed bg-paper p-6 text-center text-sm text-slate-500">
              Багц идэвхгүй байна.
              {firstTimer && <span className="block mt-1 font-bold text-emerald-600">Эхний сар үнэгүй!</span>}
              <Link href="/membership" className="mt-3 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
                Багц сонгох →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
