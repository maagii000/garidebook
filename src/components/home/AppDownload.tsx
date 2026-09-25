import Link from "next/link";

const STORES = [
  { label: "Google Play", sub: "Удахгүй", href: "/catalog" },
  { label: "App Store", sub: "Удахгүй", href: "/catalog" },
  { label: "AppGallery", sub: "Удахгүй", href: "/catalog" },
];

export default function AppDownload() {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-14 text-center">
      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
        Хүссэн газраа хүссэн цагтаа хямд ном ав
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Автобусанд суугаад, гэртээ тухлаад — утаснаасаа P2P зараа оруулж, кредитээ шалга.
        Вэб хувилбар бүрэн ажиллаж байна, апп тун удахгүй.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {STORES.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 shadow-sm hover:shadow-md transition text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white text-base" aria-hidden>
              ▶
            </span>
            <span>
              <span className="block text-[10px] font-bold text-slate-400">{s.sub}</span>
              <span className="block text-sm font-extrabold text-slate-900">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
