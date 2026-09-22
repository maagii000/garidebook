import Link from "next/link";
import { Book, CATEGORY_LABEL, STATUS_LABEL } from "@/lib/types";
import RatingStars from "./RatingStars";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-sage-light text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  sold: "bg-slate-200 text-slate-600",
  rejected: "bg-red-100 text-red-600",
};

const CONDITION_COLOR: Record<string, string> = {
  new: "from-orange-400 to-amber-500",
  like_new: "from-blue-500 to-indigo-600",
  good: "from-emerald-500 to-teal-600",
  used: "from-slate-500 to-slate-700",
};

export default function BookCard({ book }: { book: Book }) {
  const cover = book.images?.[0];
  return (
    <Link
      href={`/books/${book.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition"
    >
      <div className="relative h-44 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={book.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${CONDITION_COLOR[book.condition]} flex items-center justify-center p-4`}>
            <span className="text-white font-extrabold text-lg text-center leading-snug clamp-2">
              {book.title}
            </span>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[book.status]}`}>
          {STATUS_LABEL[book.status]}
        </span>
        {book.source === "official" && (
          <span className="absolute right-2 top-2 rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-white">
            Garidebook
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {CATEGORY_LABEL[book.category]} • {book.author}
        </div>
        <div className="mt-1 font-bold leading-snug clamp-2 min-h-[2.6em]">{book.title}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <RatingStars value={book.avgRating} />
          <span className="text-xs text-slate-500">
            {book.avgRating > 0 ? book.avgRating.toFixed(1) : "—"} ({book.reviewCount})
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-extrabold text-navy">{book.priceCash.toLocaleString()}₮</span>
          <span className="rounded-full bg-accent-light px-2.5 py-1 text-xs font-bold text-accent-dark">
            + кредитээр хямдруулна
          </span>
        </div>
      </div>
    </Link>
  );
}
