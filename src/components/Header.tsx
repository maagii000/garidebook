"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useStore } from "@/lib/store";

export default function Header() {
  const { data: session, status } = useSession();
  const { credit } = useStore();
  const [open, setOpen] = useState(false);
  const authed = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white text-lg">
              G
            </span>
            <span>
              Garide<span className="text-accent">book</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link href="/catalog" className="hover:text-accent">Каталоги</Link>
            <Link href="/books/new" className="hover:text-accent">Ном нэмэх</Link>
            <Link href="/my-books" className="hover:text-accent">Миний номууд</Link>
            <Link href="/wishlist" className="hover:text-accent">Хүсэл</Link>
            {(session?.user as { role?: string } | undefined)?.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-accent">Админ</Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {authed && (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/20"
                title="Кредит данс"
              >
                <span className="text-accent">●</span> {credit} кр
              </Link>
            )}
            {status === "loading" ? (
              <span className="text-sm text-white/50">...</span>
            ) : authed ? (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link href="/profile" className="font-semibold hover:underline max-w-28 truncate">
                  {session.user?.name ?? session.user?.email}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg bg-white/10 px-2.5 py-1.5 hover:bg-white/20"
                >
                  Гарах
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-lg bg-accent px-3.5 py-2 text-sm font-bold hover:bg-accent-dark"
              >
                Нэвтрэх
              </Link>
            )}
            <button
              className="md:hidden rounded-lg bg-white/10 px-3 py-2"
              onClick={() => setOpen((v) => !v)}
              aria-label="menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-2 text-sm font-medium bg-navy-dark">
          <Link href="/catalog" onClick={() => setOpen(false)}>📚 Каталоги</Link>
          <Link href="/books/new" onClick={() => setOpen(false)}>➕ Ном нэмэх (+кредит)</Link>
          <Link href="/my-books" onClick={() => setOpen(false)}>📖 Миний номууд</Link>
          <Link href="/wishlist" onClick={() => setOpen(false)}>🤍 Хүсэл</Link>
          {authed && <Link href="/profile" onClick={() => setOpen(false)}>💳 Профайл ({credit} кр)</Link>}
          {(session?.user as { role?: string } | undefined)?.role === "ADMIN" && (
            <Link href="/admin" onClick={() => setOpen(false)}>🛠 Админ</Link>
          )}
          {!authed && status !== "loading" && <Link href="/login" onClick={() => setOpen(false)}>🔑 Нэвтрэх</Link>}
          {authed && (
            <button className="text-left" onClick={() => signOut({ callbackUrl: "/" })}>🚪 Гарах</button>
          )}
        </nav>
      )}
    </header>
  );
}
