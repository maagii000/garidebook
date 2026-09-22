"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/catalog", label: "Каталоги" },
  { href: "/books/new", label: "Ном нэмэх" },
  { href: "/my-books", label: "Миний номууд" },
  { href: "/wishlist", label: "Хүсэл" },
  { href: "/profile", label: "Кредит данс" },
];

export default function Header() {
  const { data: session, status } = useSession();
  const { credit } = useStore();
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
      {/* Дээд эгнээ: logo + search + кредит + profile */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white text-lg">
              G
            </span>
            <span className="text-slate-900">
              Garide<span className="text-accent">book</span>
            </span>
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
            {authed && (
              <Link
                href="/profile"
                title="Кредит данс"
                className="flex items-center gap-1.5 rounded-full bg-accent-light px-3.5 py-2 text-sm font-extrabold text-accent-dark hover:bg-orange-100 transition"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-white text-xs">
                  ●
                </span>
                {credit} кр
              </Link>
            )}
            {status === "loading" ? (
              <span className="text-sm text-slate-400">...</span>
            ) : authed ? (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link
                  href="/profile"
                  className="font-semibold text-slate-700 hover:underline max-w-28 truncate"
                >
                  {session.user?.name ?? session.user?.email}
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

      {/* Доод эгнээ: main nav (Mbook маяг) */}
      <nav className="hidden md:block border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 flex items-center gap-6 text-sm font-bold text-slate-600">
          {NAV.map((n) => {
            const active =
              pathname === n.href ||
              (n.href === "/catalog" && pathname.startsWith("/books"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative py-3 hover:text-navy transition ${
                  active ? "text-blue-600" : ""
                }`}
              >
                {n.label}
                {n.href === "/books/new" && (
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
                    +кредит
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`relative py-3 hover:text-navy ${
                pathname === "/admin" ? "text-blue-600" : ""
              }`}
            >
              Админ
              {pathname === "/admin" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
              )}
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
            <Link href="/catalog" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Каталоги</Link>
            <Link href="/books/new" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Ном нэмэх (+кредит)</Link>
            <Link href="/my-books" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Миний номууд</Link>
            <Link href="/wishlist" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Хүсэл</Link>
            {authed && <Link href="/profile" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-50">Профайл ({credit} кр)</Link>}
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
