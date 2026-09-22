"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import { Book, CATEGORY_LABEL, CONDITION_LABEL, STATUS_LABEL } from "@/lib/types";
import RatingStars from "@/components/RatingStars";
import BookCard from "@/components/BookCard";

interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { books, addReview, toggleWishlist, wishlist, notify } = useStore();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.book) { setBook(d.book); setReviews(d.reviews ?? []); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Ачааллаж байна...</div>;
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-5xl">📕</div>
        <h1 className="mt-3 text-xl font-extrabold">Ном олдсонгүй</h1>
        <Link href="/catalog" className="mt-4 inline-block text-accent-dark font-bold hover:underline">
          ← Каталоги руу буцах
        </Link>
      </div>
    );
  }

  const related = books.filter((b) => b.id !== book.id && b.category === book.category).slice(0, 4);
  const wished = wishlist.includes(book.id);
  const cover = book.images?.[0];

  async function submitReview() {
    if (!book) return;
    if (!session) { router.push("/login"); return; }
    if (!text.trim()) { notify("Сэтгэгдлээ бичнэ үү", "err"); return; }
    setSending(true);
    const res = await addReview(book.id, rating, text.trim());
    setSending(false);
    if ("error" in res) { notify(res.error, "err"); return; }
    setText("");
    const d = await fetch(`/api/books/${id}`).then((r) => r.json());
    if (d.book) { setBook(d.book); setReviews(d.reviews ?? []); }
    notify("Ревью нэмэгдлээ ✓");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/catalog" className="text-sm font-bold text-slate-500 hover:text-accent-dark">
        ← Каталоги
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={book.title} className="h-96 w-full object-cover" />
          ) : (
            <div className="h-96 grid place-items-center bg-gradient-to-br from-navy to-indigo-600 p-8 text-center">
              <div>
                <div className="text-6xl">📚</div>
                <div className="mt-3 text-2xl font-extrabold text-white">{book.title}</div>
                <div className="text-white/70">{book.author}</div>
              </div>
            </div>
          )}
          {book.images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {book.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover border" />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-navy-light px-3 py-1 text-navy">{CATEGORY_LABEL[book.category]}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{CONDITION_LABEL[book.condition]}</span>
            <span className="rounded-full bg-sage-light px-3 py-1 text-emerald-700">{STATUS_LABEL[book.status]}</span>
            <span className="rounded-full bg-accent-light px-3 py-1 text-accent-dark">
              {book.source === "official" ? "Garidebook Stock" : "Сурагчийн зар (P2P)"}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight">{book.title}</h1>
          <div className="text-slate-500">{book.author} • Нийлүүлэгч: {book.ownerName}</div>

          <div className="mt-2 flex items-center gap-2">
            <RatingStars value={book.avgRating} size="text-lg" />
            <span className="text-sm text-slate-500">
              {book.avgRating > 0 ? book.avgRating.toFixed(1) : "Үнэлгээ байхгүй"} ({book.reviewCount})
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600">{book.description}</p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold">ҮНЭ (туршилт)</div>
              <div className="text-3xl font-extrabold text-navy">{book.priceCash.toLocaleString()}₮</div>
              <div className="text-xs text-slate-500">+ кредитээр 2,000₮ хүртэл хямдруулж болно</div>
            </div>
            <button
              onClick={() => { if (!session) { router.push("/login"); return; } toggleWishlist(book.id); }}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold border ${wished ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-300"}`}
            >
              {wished ? "♥ Хадгалсан" : "♡ Хадгалах"}
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              disabled={book.status === "sold"}
              onClick={() => router.push(session ? `/checkout/${book.id}` : "/login")}
              className="flex-1 rounded-xl bg-accent px-5 py-3.5 font-extrabold text-white hover:bg-accent-dark disabled:opacity-40"
            >
              {book.status === "sold" ? "Зарагдсан" : "💳 Кредит + Мөнгөөр авах"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-extrabold text-navy">Ревью ({reviews.length})</h2>
          <div className="mt-3 space-y-3">
            {reviews.length === 0 && (
              <div className="rounded-2xl bg-white border p-5 text-sm text-slate-500">
                Анхны ревьюг та бичээрэй.
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{r.userName}</span>
                  <RatingStars value={r.rating} />
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-6">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-navy">Ревью бичих</h2>
          <div className="mt-3 rounded-2xl bg-white border p-5">
            <div className="text-sm font-bold">Үнэлгээ (1–5 од)</div>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}
                  className={`text-3xl ${s <= rating ? "text-accent" : "text-slate-300"}`} aria-label={`${s} од`}>
                  ★
                </button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
              placeholder="Номын тухай сэтгэгдлээ бичнэ үү..."
              className="mt-3 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            <button onClick={submitReview} disabled={sending}
              className="mt-3 w-full rounded-xl bg-sage px-4 py-3 font-bold text-white hover:brightness-95 disabled:opacity-50">
              {sending ? "Нийтэлж байна..." : "Нийтлэх"}
            </button>
            {!session && <p className="mt-2 text-xs text-slate-500 text-center">Ревью бичихэд нэвтрэх шаардлагатай.</p>}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-navy">Төстэй номууд</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
