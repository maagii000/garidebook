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
  const [matches, setMatches] = useState<{ id: string; partner: Person }[]>([]);
  const [anim, setAnim] = useState<"left" | "right" | null>(null);
  const [justMatched, setJustMatched] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(true);

  const load = useCallback(() => {
    fetch("/api/match/feed")
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

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

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
  const next = feed[1] ?? null;

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
          load();
        }
      } catch { /* ignore */ }
      setFeed((p) => p.slice(1));
      setAnim(null);
    }, dir === "right" ? 450 : 450);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-black">Хамтрагч олох</h1>
        <p className="text-slate-500 mt-1">Баруун тийш — таалагдлаа, зүүн тийш — алгасъя</p>
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
            <Link href="/chat" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">Чат нээх</Link>
            <button onClick={() => setJustMatched(null)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold">Үргэлжлүүлэх</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm mx-auto relative h-[540px]">
        {top ? (
          <>
            {next && (
              <div className="absolute w-full h-full bg-white rounded-[2rem] border border-gray-100 p-6 shadow-apple flex flex-col items-center scale-95 origin-bottom translate-y-4">
                <div className="w-full flex-grow bg-gray-100 rounded-2xl mb-4 overflow-hidden">
                  <Avatar person={next} />
                </div>
                <div className="w-full text-left">
                  <h3 className="text-2xl font-bold text-black">{next.name}</h3>
                  <p className="text-slate-500 text-sm mb-2">{next.school}</p>
                  <p className="text-sm line-clamp-2">{next.bio || "Танилцуулга бичигдээгүй."}</p>
                </div>
              </div>
            )}
            <div
              className={`absolute w-full h-full bg-white rounded-[2rem] border border-gray-100 p-6 shadow-apple-hover flex flex-col items-center z-10 cursor-grab active:cursor-grabbing ${
                anim === "right" ? "animate-swipe-right" : anim === "left" ? "animate-swipe-left" : ""
              }`}
            >
              <div className="w-full flex-[0.75] bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                <Avatar person={top} />
                {top.interests && (
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {top.interests.split(",")[0].trim()}
                  </div>
                )}
              </div>
              <div className="w-full text-left mb-5">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-black">
                  {top.name} <BadgeCheck className="text-brand" />
                </h3>
                <p className="text-slate-500 text-sm mb-2">{top.school}</p>
                <p className="text-sm font-medium leading-relaxed line-clamp-2">
                  {top.bio ? `“${top.bio}”` : "Танилцуулга бичигдээгүй."}
                </p>
                {top.interests && (
                  <p className="mt-1 text-xs text-slate-400">Сонирхол: {top.interests}</p>
                )}
              </div>
              <div className="flex justify-center gap-6 w-full">
                <button onClick={() => swipe("left")} aria-label="алгасах"
                  className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
                <button onClick={() => swipe("right")} aria-label="таалагдлаа"
                  className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white hover:bg-gray-800 transition-all shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute w-full h-full bg-white rounded-[2rem] border border-dashed border-gray-200 p-10 text-center flex flex-col items-center justify-center">
            <div className="font-extrabold text-black">Шинэ хүмүүс алга</div>
            <p className="mt-1 text-sm text-slate-500">Дараа эргэж ирээрэй — эсвэл танилцуулгаа баяжуул.</p>
            <Link href="/profile" className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">
              Профайл засах
            </Link>
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="mx-auto max-w-sm mt-8">
          <h2 className="text-lg font-extrabold text-black mb-3">Match-ууд ({matches.length})</h2>
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-apple">
                <Avatar person={m.partner} small />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-black truncate">{m.partner.name}</div>
                  <div className="text-xs text-slate-400 truncate">{m.partner.school}</div>
                </div>
                <Link href="/chat" className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white shrink-0">
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
    return <img src={person.image} alt={person.name} className="w-full h-full object-cover" />;
  }
  const initial = person.name.slice(0, 1).toUpperCase();
  return (
    <div className={`w-full h-full grid place-items-center bg-gradient-to-br from-slate-100 to-slate-200 ${small ? "rounded-full" : ""}`}>
      <span className={`${small ? "text-sm" : "text-7xl"} font-extrabold text-slate-400`}>{initial}</span>
    </div>
  );
}
