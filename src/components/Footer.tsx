import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-12">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-extrabold text-slate-900 text-lg">
            Garide<span className="text-accent">book</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Уншсан номоо оруулж кредит цуглуул, кредит + мөнгөөр ~5,000₮-өөр
            хямд ном ав. UFE Entrepreneurship прототайп.
          </p>
          <Link
            href="/books/new"
            className="mt-4 inline-flex rounded-full bg-navy px-4 py-2 text-xs font-extrabold text-white hover:bg-navy-dark"
          >
            Ном оруулж +кредит авах
          </Link>
        </div>
        <div className="text-sm">
          <div className="font-extrabold text-blue-600 mb-3">Хурдан холбоос</div>
          <div className="flex flex-col gap-2 text-slate-600">
            <Link href="/catalog" className="hover:text-navy">Каталоги</Link>
            <Link href="/books/new" className="hover:text-navy">Ном нэмэх</Link>
            <Link href="/profile" className="hover:text-navy">Кредит данс</Link>
            <Link href="/wishlist" className="hover:text-navy">Хүсэл</Link>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-extrabold text-blue-600 mb-3">Кредит дүрэм (MVP)</div>
          <ul className="space-y-2 text-slate-600">
            <li>Ном оруулах: +60 ~ +120 кредит</li>
            <li>1 кредит = 10₮ хөнгөлөлт</li>
            <li>Суурь үнэ: 5,000₮</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 Garidebook • Prototype / MVP • UFE төсөл
      </div>
    </footer>
  );
}
