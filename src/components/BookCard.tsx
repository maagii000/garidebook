import Link from "next/link";
import Image from "next/image";
import { Book, CONDITION_LABEL } from "@/lib/types";
import RatingStars from "./RatingStars";
import CoverArt from "./CoverArt";

const CONDITION_BADGE: Record<string, string> = {
  new: "bg-orange-500",
  like_new: "bg-blue-600",
  good: "bg-emerald-600",
  used: "bg-slate-500",
};

export default function BookCard({ book, className = "w-[160px] md:w-[180px]" }: { book: Book; className?: string }) {
  const cover = book.images?.[0] || book.coverUrl;
  return (
    <Link
      href={`/books/${book.id}`}
      className={`group card-hover shrink-0 overflow-hidden rounded-[1.5rem] bg-white border border-gray-100 shadow-apple ${className}`}
    >
      {/* Босоо ковер 3:4 — хурц (тавиур мэдрэмж) */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 m-2 mb-0">
        {cover ? (
          <Image
            src={cover}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 45vw, 180px"
            loading="lazy"
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <CoverArt book={book} />
        )}
        {/* Нөхцөл — цорын ганц badge */}
        <span
          className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/95 shadow-sm ${CONDITION_BADGE[book.condition]}`}
        >
          {CONDITION_LABEL[book.condition]}
        </span>
        {book.status === "sold" && (
          <span className="absolute inset-0 grid place-items-center bg-slate-900/50 text-white text-xs font-extrabold">
            Зарагдсан
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="text-[13px] font-bold leading-snug clamp-2 min-h-[2.5em] text-slate-900">
          {book.title}
        </div>
        <div className="text-xs text-slate-500 truncate">{book.author}</div>

        {book.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <RatingStars value={book.avgRating} />
            <span className="text-[11px] text-slate-400">
              {book.avgRating > 0 ? book.avgRating.toFixed(1) : "—"} ({book.reviewCount})
            </span>
          </div>
        )}

        {/* Үнэ */}
        <div className="mt-2 rounded-xl bg-slate-50 px-2.5 py-2">
          <span className="text-sm font-extrabold text-navy">
            {book.priceCash.toLocaleString()}₮
          </span>
          {book.source !== "official" && (
            <span className="ml-1.5 text-[10px] font-bold text-slate-400">P2P</span>
          )}
        </div>
      </div>
    </Link>
  );
}
