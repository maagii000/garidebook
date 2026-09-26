"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Book, BookStatus, MockUser, Order } from "./types";

interface ToastMsg {
  id: number;
  kind: "ok" | "err";
  text: string;
}

interface StoreShape {
  user: MockUser | null;
  books: Book[];
  wishlist: string[];
  wishlistBooks: Book[];
  orders: Order[];
  loading: boolean;
  notify: (text: string, kind?: "ok" | "err") => void;
  toasts: ToastMsg[];
  refreshAll: (force?: boolean) => void;
  addReview: (bookId: string, rating: number, text: string) => Promise<{ ok: boolean } | { error: string }>;
  toggleWishlist: (bookId: string) => Promise<void>;
  checkout: (bookId: string) => Promise<{ order: Order } | { error: string }>;
  adminSetStatus: (bookId: string, status: BookStatus) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<StoreShape | null>(null);

// Module-level: books жагсаалтын сүүлд татсан цаг
let lastBooksFetch = 0;

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Алдаа (${r.status})`);
  return data as T;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  const [books, setBooks] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const notify = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, kind, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const refreshAll = useCallback((force = false) => {
    const now = Date.now();
    // Номын жагсаалт 60с cache (edge cache-тэй хамт давхар хамгаалалт)
    if (force || now - lastBooksFetch > 60_000) {
      lastBooksFetch = now;
      j<{ books: Book[] }>("/api/books").then((d) => setBooks(d.books)).catch(() => {});
    }
    if (!authed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      j<{ ids: string[]; books: Book[] }>("/api/wishlist").catch(() => null),
      j<{ orders: Order[] }>("/api/orders").catch(() => null),
    ]).then(([w, o]) => {
      if (w) { setWishlist(w.ids); setWishlistBooks(w.books); }
      if (o) setOrders(o.orders);
      setLoading(false);
    });
  }, [authed]);

  useEffect(() => {
    if (status === "loading") return;
    // External API → state sync; this is the legitimate useEffect use-case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAll();
  }, [status, refreshAll]);

  const user: MockUser | null = useMemo(() => {
    if (!session?.user?.email) return null;
    return { name: session.user.name ?? session.user.email, email: session.user.email };
  }, [session]);

  const value = useMemo<StoreShape>(() => ({
    user, books, wishlist, wishlistBooks, orders, loading,
    notify, toasts, refreshAll,

    addReview: async (bookId, rating, text) => {
      try {
        await j(`/api/books/${bookId}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, text }),
        });
        refreshAll(true);
        return { ok: true };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Алдаа гарлаа" };
      }
    },

    toggleWishlist: async (bookId) => {
      try {
        await j("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        const w = await j<{ ids: string[]; books: Book[] }>("/api/wishlist");
        setWishlist(w.ids);
        setWishlistBooks(w.books);
      } catch (e) {
        notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
      }
    },

    checkout: async (bookId) => {
      try {
        const d = await j<{ order: Order }>("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        refreshAll(true);
        return { order: d.order };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Алдаа гарлаа" };
      }
    },

    adminSetStatus: async (bookId, st) => {
      try {
        await j(`/api/books/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: st }),
        });
        refreshAll(true);
        notify("Төлөв шинэчлэгдлээ ✓");
      } catch (e) {
        notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
      }
    },

    logout: () => signOut({ callbackUrl: "/" }),
  }), [user, books, wishlist, wishlistBooks, orders, loading, notify, toasts, refreshAll]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Toasts — Apple prototype: хар баруун-доод */}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2 w-[92%] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-scale-up flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium shadow-2xl ${
              t.kind === "ok" ? "bg-black text-white" : "bg-red-600 text-white"
            }`}
          >
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${t.kind === "ok" ? "bg-emerald-500" : "bg-white/30"} text-white text-xs font-bold`}>
              {t.kind === "ok" ? "✓" : "!"}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider дотор ашиглана");
  return v;
}
