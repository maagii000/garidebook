"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const NAV = [
  { href: "/catalog", label: "Хувь хүний хөгжил" },
  { href: "/ads", label: "Хар зах" },
  { href: "/hub", label: "Материал заръя" },
  { href: "/chat", label: "Чат" },
  { href: "/match", label: "Хосоо ол" },
  { href: "/wellness", label: "Positive орчин" },
  { href: "/membership", label: "Гишүүнчлэл" },
  { href: "/profile", label: "Профайл" },
];

export default function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const authed = status === "authenticated";
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const s = q.trim();
    router.push(s ? `/catalog?q=${encodeURIComponent(s)}` : "/catalog");
    setOpen(false);
  };

  return (
    <header className="glass-nav sticky top-0 z-40">
      {/* Дээд эгнээ: logo + search + profile */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-3">
          <Link href="/" className="flex items-center shrink-0" aria-label="Level Up Hub">
            <span className="font-extrabold tracking-tight text-black text-[22px]">Level</span>
            <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[13px] font-extrabold text-white">Up Hub</span>
          </Link>

          <form
            onSubmit={submitSearch}
            className="hidden md:flex flex-1 max-w-xl mx-auto items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/20 focus-within:border focus-within:border-navy/30 border border-transparent transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-400 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ном, зохиолчоор хайх..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            {status === "loading" ? (
              <span className="text-sm text-slate-400">...</span>
            ) : authed ? (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link
                  href="/profile"
                  title={session.user?.name ?? session.user?.email ?? "Профайл"}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black text-white font-bold shadow-md border-2 border-white hover:bg-gray-800"
                >
                  {(session.user?.name ?? session.user?.email ?? "Г").slice(0, 1).toUpperCase()}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600 hover:bg-slate-200"
                >
                  Гарах
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy-dark"
              >
                Нэвтрэх
              </Link>
            )}
            <button
              className="md:hidden rounded-lg bg-slate-100 px-3 py-2"
              onClick={() => setOpen((v) => !v)}
              aria-label="menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Доод эгнээ: pill nav (Apple prototype) */}
      <nav className="hidden md:block border-t border-black/5">
        <div className="mx-auto max-w-7xl px-4 flex items-center gap-1 py-2 text-sm font-medium">
          {NAV.map((n) => {
            const active =
              pathname === n.href ||
              (n.href === "/catalog" && pathname.startsWith("/books"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  active
                    ? "text-brand bg-brand/10"
                    : "text-slate-500 hover:text-black hover:bg-black/5"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                pathname === "/admin"
                  ? "text-brand bg-brand/10"
                  : "text-slate-500 hover:text-black hover:bg-black/5"
              }`}
            >
              Админ
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3">
          <form
            onSubmit={submitSearch}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-400 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ном, зохиолчоор хайх..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            <Link href="/catalog" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Хувь хүний хөгжил</Link>
            <Link href="/ads" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Хар зах</Link>
            <Link href="/hub" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Материал заръя</Link>
            <Link href="/chat" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Чат</Link>
            <Link href="/match" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Хосоо ол</Link>
            <Link href="/wellness" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Positive орчин</Link>
            <Link href="/membership" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Гишүүнчлэл</Link>
            {authed && <Link href="/profile" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Профайл</Link>}
            {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Админ</Link>}
            {!authed && status !== "loading" && <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 bg-navy text-white text-center">Нэвтрэх</Link>}
            {authed && (
              <button className="text-left rounded-lg px-2 py-2 hover:bg-slate-50" onClick={() => signOut({ callbackUrl: "/" })}>Гарах</button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
