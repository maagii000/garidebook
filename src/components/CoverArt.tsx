import { Book, CATEGORY_LABEL } from "@/lib/types";

// Номын нэрээс тогтвортой theme сонгоно (ковергүй номонд)
const THEMES = [
  "from-blue-600 via-indigo-700 to-indigo-900",
  "from-orange-500 via-amber-600 to-amber-800",
  "from-emerald-600 via-teal-700 to-teal-900",
  "from-rose-500 via-pink-600 to-rose-800",
  "from-violet-600 via-purple-700 to-purple-900",
  "from-cyan-600 via-sky-700 to-blue-900",
];

function themeFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return THEMES[h % THEMES.length];
}

export default function CoverArt({ book, className = "" }: { book: Book; className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${themeFor(book.id)} ${className}`}>
      {/* чимэглэл */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/10" />
      <div className="absolute right-4 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border-2 border-white/15" />
      {/* агуулга */}
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
          {CATEGORY_LABEL[book.category]}
        </div>
        <div>
          <div className="font-serif text-lg font-extrabold leading-snug text-white clamp-2">
            {book.title}
          </div>
          <div className="mt-1 text-xs font-medium text-white/75 truncate">{book.author}</div>
        </div>
        <div className="text-[9px] font-bold tracking-widest text-white/40">
          LEVEL UP HUB
        </div>
      </div>
    </div>
  );
}
