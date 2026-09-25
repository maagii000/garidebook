import Link from "next/link";
import { useRef } from "react";
import { Book } from "@/lib/types";
import BookCard from "./BookCard";
import { Reveal } from "./Reveal";

interface Props {
  title: string;
  subtitle?: string;
  href?: string;
  books: Book[];
  totalCount?: number;
  emptyText?: string;
  badge?: string;
  minCount?: number;
}

export default function BookRail({ title, subtitle, href, books, totalCount, emptyText, badge, minCount = 3 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  };

  if (books.length === 0) return null;
  // Ном цөөхөн rail-ийг нуух (давхардлыг багасгана)
  if (books.length < minCount) return null;

  return (
    <Reveal as="section" className="mt-10 cv-auto">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            {title}
            {badge && (
              <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-[11px] font-extrabold text-accent-dark">
                {badge}
              </span>
            )}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="зүүн"
            className="hidden md:grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            ←
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="баруун"
            className="hidden md:grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            →
          </button>
          {href && (
            <Link href={href} className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap">
              Бүгдийг үзэх ({totalCount ?? books.length}) →
            </Link>
          )}
        </div>
      </div>
      <div ref={ref} className="rail-scroll mt-4">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      {books.length === 0 && emptyText && (
        <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
      )}
    </Reveal>
  );
}
