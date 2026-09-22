import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80 mt-12">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-extrabold text-white text-lg">
            Garide<span className="text-accent">book</span>
          </div>
          <p className="mt-2 text-sm leading-6">
            Уншсан номоо оруулж кредит цуглуул, кредит + мөнгөөр ~5,000₮-өөр
            хямд ном ав. UFE Entrepreneurship прототайп.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-bold text-white mb-2">Хурдан холбоос</div>
          <div className="flex flex-col gap-1.5">
            <Link href="/catalog" className="hover:text-accent">Каталоги</Link>
            <Link href="/books/new" className="hover:text-accent">Ном нэмэх</Link>
            <Link href="/profile" className="hover:text-accent">Кредит данс</Link>
            <Link href="/admin" className="hover:text-accent">Админ</Link>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-bold text-white mb-2">Кредит дүрэм (MVP)</div>
          <ul className="space-y-1.5">
            <li>📸 Ном оруулах: +60 ~ +120 кредит</li>
            <li>💱 1 кредит = 10₮ хөнгөлөлт</li>
            <li>📚 Суурь үнэ: 5,000₮</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © 2026 Garidebook • Prototype / MVP • UFE төсөл
      </div>
    </footer>
  );
}
