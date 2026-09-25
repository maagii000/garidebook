import Link from "next/link";
import { CREDIT_TO_MNT, MAX_CREDIT_USE_PER_ORDER } from "@/lib/types";

const STATS: [string, string][] = [
  ["60–120", "ном оруулахад"],
  ["10₮", "1 кредит ="],
  ["200кр", "max / захиалга"],
];

export default function CreditService() {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-14 text-center">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
        Кредит <span className="text-blue-600">үйлчилгээ</span>
      </h2>
      <p className="mt-1 text-sm font-bold text-slate-400">
        Уншсан номоо оруулаад хямд ном ав — P2P эргэлтэд
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        Монголын сурагчдын анхны ном солилцох кредит платформ Garidebook Танд хүрч байна.
        Уншсан номоо оруулаад кредит цуглуулж, хямд үнээр илүү их унших боломжийг нээгээрэй.
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white text-left">
        <div className="px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/60">
              Garidebook Stock
            </div>
            <div className="mt-1 text-2xl md:text-3xl font-extrabold leading-tight">
              Суурь 5,000₮ → кредитээр 3,000₮
            </div>
            <p className="mt-2 text-sm text-white/70 max-w-md leading-6">
              {(MAX_CREDIT_USE_PER_ORDER * CREDIT_TO_MNT).toLocaleString()}₮ хүртэл хөнгөл.
              P2P хүлээлтгүй, баталгаатай төлөв.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/books/new"
                className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-extrabold text-white hover:bg-accent-dark"
              >
                Ном оруулж +кредит авах
              </Link>
              <Link
                href="/catalog"
                className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-blue-800 hover:bg-blue-50"
              >
                Stock үзэх →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-6 text-center w-full md:w-auto">
            {STATS.map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 px-2 py-3 md:px-5 md:py-4 md:min-w-[110px]">
                <div className="text-base md:text-xl font-extrabold whitespace-nowrap">{v}</div>
                <div className="mt-0.5 text-[10px] md:text-[11px] text-white/65 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
