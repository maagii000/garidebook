"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { credit, txs, orders, notify } = useStore();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState<"study" | "business">("study");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-3xl bg-navy text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-2xl font-extrabold">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{name}</h1>
          <div className="text-white/60 text-sm">{session.user.email}</div>
          {(session.user as { role?: string }).role === "ADMIN" && (
            <Link href="/admin" className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold">
              Админ
            </Link>
          )}
        </div>
        <div className="rounded-2xl bg-white/10 px-5 py-4 text-center">
          <div className="text-xs font-bold text-white/60">КРЕДИТ ҮЛДЭГДЭЛ</div>
          <div className="text-3xl font-extrabold text-accent">{credit}</div>
          <div className="text-xs text-white/60">≈ {(credit * 10).toLocaleString()}₮ хөнгөлөлт</div>
        </div>
      </div>

      <div className="mt-6 rounded-[2rem] border border-gray-100 bg-white p-5 md:p-6 shadow-apple">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold text-black">Миний танилцуулга</h2>
          <Link href="/match" className="text-xs font-bold text-brand hover:underline">Хамтрагч →</Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">Хамтрагч олох хэсэгт ингэж харагдана. Утас, имэйл хэзээ ч харагдахгүй.</p>
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

      <div className="mt-6 grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl border bg-white p-5">
          <h2 className="font-extrabold text-navy">Кредит түүх</h2>
          <div className="mt-3 space-y-2 max-h-80 overflow-auto">
            {txs.length === 0 && <div className="text-sm text-slate-500">Түүх хоосон байна.</div>}
            {txs.map((t) => (
              <div key={t.id} className="flex justify-between gap-3 rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
                <div>
                  <div className="font-bold">{t.reason}</div>
                  {t.bookTitle && <div className="text-xs text-slate-500">{t.bookTitle}</div>}
                  <div className="text-[11px] text-slate-400">{String(t.createdAt).slice(0, 10)}</div>
                </div>
                <span className={`font-extrabold ${t.amount >= 0 ? "text-sage" : "text-red-500"}`}>
                  {t.amount >= 0 ? "+" : ""}{t.amount}
                </span>
              </div>
            ))}
          </div>
          <Link href="/books/new" className="mt-4 block text-center rounded-xl bg-accent px-4 py-3 font-bold text-white hover:bg-accent-dark">
            Ном оруулж кредит нэмэх
          </Link>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <h2 className="font-extrabold text-navy">Миний захиалгууд ({orders.length})</h2>
          <div className="mt-3 space-y-2 max-h-80 overflow-auto">
            {orders.length === 0 && <div className="text-sm text-slate-500">Захиалга байхгүй. Хувь хүний хөгжлөөс сонгоорой.</div>}
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl bg-paper border px-3.5 py-2.5 text-sm">
                <div className="font-bold">{o.bookTitle}</div>
                <div className="text-xs text-slate-500">
                  Бэлэн: {o.cashPaid.toLocaleString()}₮ • Кредит: {o.creditSpent} • {String(o.createdAt).slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { notify("Та гарах гэж байна"); signOut({ callbackUrl: "/" }); }}
            className="mt-4 w-full rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-sm font-bold hover:bg-red-50"
          >
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}
