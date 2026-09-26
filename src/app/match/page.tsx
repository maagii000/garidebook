"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Person {
  id: string;
  name: string;
  school: string;
  interests: string;
  bio: string;
  image: string | null;
}

function BadgeCheck({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2 14.5 4.5 18 4l.5 3.5L22 9l-1.5 3L22 15l-3.5 1.5L18 20l-3.5-.5L12 22l-2.5-2.5L6 20l-.5-3.5L2 15l1.5-3L2 9l3.5-1.5L6 4l3.5.5Z" opacity="0" />
      <path d="M12 1.8 14.7 4l3.7-.5.7 3.7 3.1 1.8-1.4 3 1.4 3-3.1 1.8-.7 3.7-3.7-.5L12 22.2 9.3 20l-3.7.5-.7-3.7-3.1-1.8 1.4-3-1.4-3 3.1-1.8.7-3.7 3.7.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MatchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feed, setFeed] = useState<Person[]>([]);
  const [matches, setMatches] = useState<{ id: string; roomId: string | null; partner: Person }[]>([]);
  const [anim, setAnim] = useState<"left" | "right" | null>(null);
  const [justMatched, setJustMatched] = useState<string | null>(null);
  const [justMatchedRoom, setJustMatchedRoom] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Дахин эхлэх: миний swipe-үүдийг цэвэрлэж deck-ийг шинээр ачаална
  async function resetDeck() {
    setResetting(true);
    try {
      await fetch("/api/match/feed", { method: "DELETE" });
    } catch { /* ignore */ }
    setFeed([]);
    setResetting(false);
    load(mode);
  }
  const [hasProfile, setHasProfile] = useState(true);
  const [mode, setMode] = useState<"study" | "business">("study");

  const load = useCallback((m: "study" | "business") => {
    fetch(`/api/match/feed?mode=${m}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.feed) setFeed(d.feed); })
      .catch(() => {});
    fetch("/api/match/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.matches) setMatches(d.matches); })
      .catch(() => {});
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.me) setHasProfile(!!(d.me.nickname || d.me.bio || d.me.school)); })
      .catch(() => {});
  }, []);

  useEffect(() => { if (status === "authenticated") load(mode); }, [status, mode, load]);

  if (status === "loading") {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-400">Ачааллаж байна...</div>;
  }
  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold text-black">Эхлээд нэвтэрнэ үү</h1>
        <button onClick={() => router.push("/login")} className="mt-5 rounded-full bg-black px-6 py-3 text-sm font-bold text-white">
          Нэвтрэх
        </button>
      </div>
    );
  }

  const top = feed[0] ?? null;

  async function swipe(dir: "left" | "right") {
    if (!top || anim) return;
    setAnim(dir);
    setTimeout(async () => {
      try {
        const r = await fetch("/api/match/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toId: top.id, dir }),
        });
        const d = await r.json();
        if (d.matched) {
          setJustMatched(top.name);
          setJustMatchedRoom(d.roomId ?? null);
          load(mode);
        }
      } catch { /* ignore */ }
      setFeed((p) => p.slice(1));
      setAnim(null);
    }, dir === "right" ? 450 : 450);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-black tracking-tight">Хосоо ол</h2>
          <p className="text-sm text-slate-500 mt-1">Ижил зорилготой хамтрагчаа Tinder загвараар олоорой</p>
        </div>
        <div className="flex items-center gap-2">
          {(["study", "business"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setFeed([]); }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                mode === m ? "bg-brand text-white shadow-sm" : "bg-white text-black border border-gray-200"
              }`}
            >
              {m === "study" ? "Study Partner" : "Business Partner"}
            </button>
          ))}
        </div>
      </div>

      {!hasProfile && (
        <div className="mx-auto max-w-sm mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-center">
          Эхлээд <Link href="/profile" className="font-bold text-brand hover:underline">профайл дээрээ</Link> танилцуулгаа бөглөөрэй — бусдад ингэж харагдана.
        </div>
      )}

      {justMatched && (
        <div className="mx-auto max-w-sm mb-6 rounded-[2rem] bg-black text-white p-6 text-center shadow-apple-hover">
          <div className="text-2xl font-extrabold">Match!</div>
          <p className="mt-1 text-sm text-gray-300">{justMatched} тантай танилцахад бэлэн.</p>
          <div className="mt-4 flex gap-2 justify-center">
            <Link href={justMatchedRoom ? `/chat?room=${justMatchedRoom}` : "/chat"} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">Чат нээх</Link>
            <button onClick={() => { setJustMatched(null); setJustMatchedRoom(null); }} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold">Үргэлжлүүлэх</button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto relative min-h-[460px] flex items-center justify-center mt-8">
        {top ? (
          <>
            <div
              className={`glass-card rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative transition-all duration-300 w-full ${
                anim === "right" ? "animate-swipe-right" : anim === "left" ? "animate-swipe-left" : ""
              }`}
            >
              <div className="h-64 relative bg-[#F5F5F7]">
                <Avatar person={top} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 pointer-events-none">
                  <div>
                    <h3 className="text-white font-extrabold text-xl flex items-center gap-2">
                      {top.name} <BadgeCheck className="text-brand" />
                    </h3>
                    <p className="text-xs text-white/80">{top.school || "Сургууль бичигдээгүй"}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4 bg-white">
                <p className="text-sm text-black font-medium">{top.bio ? `“${top.bio}”` : "Танилцуулга бичигдээгүй."}</p>
                {top.interests && (
                  <div className="flex flex-wrap gap-1.5">
                    {top.interests.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5).map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-[#F5F5F7] text-black text-[11px] font-semibold border border-gray-200">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200/60">
                  <button onClick={() => swipe("left")} aria-label="алгасах"
                    className="w-14 h-14 rounded-full bg-white border border-gray-200 text-red-500 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                  <button onClick={() => swipe("right")} aria-label="таалагдлаа"
                    className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center space-y-4 w-full">
            <h4 className="font-bold text-lg text-black">Бүх хүмүүсийг харж дууслаа!</h4>
            <p className="text-xs text-slate-500">Дараа эргэж ирээрэй — эсвэл танилцуулгаа баяжуул.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={resetDeck} disabled={resetting} className="px-5 py-2.5 rounded-full bg-brand text-white text-xs font-medium disabled:opacity-50">Дахин эхлэх</button>
              <Link href="/profile" className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-black">
                Профайл засах
              </Link>
            </div>
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="mx-auto max-w-2xl mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-black mb-4">Таны таарсан (Matches) хамтрагчид</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-200">
                <Avatar person={m.partner} small />
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-xs text-black truncate">{m.partner.name}</h5>
                  <p className="text-[10px] text-slate-500 truncate">{m.partner.school}</p>
                </div>
                <Link href={m.roomId ? `/chat?room=${m.roomId}` : "/chat"} className="px-3 py-1.5 rounded-xl bg-brand/10 text-brand text-xs font-semibold hover:bg-brand hover:text-white transition-colors shrink-0">
                  Чат
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ person, small = false }: { person: Person; small?: boolean }) {
  if (person.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.image} alt={person.name} className={`${small ? "h-10 w-10 rounded-full" : "w-full h-full object-cover"}`} />;
  }
  const initial = person.name.slice(0, 1).toUpperCase();
  return (
    <div className={`grid place-items-center bg-gradient-to-br from-slate-100 to-slate-200 ${small ? "h-10 w-10 rounded-full" : "w-full h-full"}`}>
      <span className={`${small ? "text-sm" : "text-7xl"} font-extrabold text-slate-400`}>{initial}</span>
    </div>
  );
}
