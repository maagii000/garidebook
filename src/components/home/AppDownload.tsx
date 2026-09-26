const STEPS = [
  {
    n: "1",
    title: "iPhone (Safari)",
    text: "Share → Home Screen-д нэмэх (Add to Home Screen)",
  },
  {
    n: "2",
    title: "Android (Chrome)",
    text: "Цэс → Суулгах / Add to Home screen",
  },
  {
    n: "3",
    title: "Нэвтрээд эхлэх",
    text: "Google-ээр нэвтрээд эхлээрэй",
  },
];

export default function AppDownload() {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-14 text-center">
      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
        Хүссэн газраа хүссэн цагтаа хямд ном ав
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Автобусанд суугаад, гэртээ тухлаад — утаснаасаа зараа оруулж, худалдан авалтаа шалга.
        Вэб апп утсан дээр бүрэн ажиллана:
      </p>
      <div className="mx-auto mt-5 grid max-w-3xl gap-3 md:grid-cols-3 text-left">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-white text-sm font-extrabold">
                {s.n}
              </span>
              <span className="text-sm font-extrabold text-slate-900">{s.title}</span>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
