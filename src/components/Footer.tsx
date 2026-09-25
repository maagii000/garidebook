import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-xs">G</div>
          <span className="font-bold text-sm text-black">Garidebook</span>
        </div>
        <p className="text-xs text-slate-500">© 2026 Garidebook • Prototype / MVP • UFE төсөл</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <Link href="/catalog" className="hover:text-black">Каталоги</Link>
          <Link href="/profile" className="hover:text-black">Тусламж</Link>
          <Link href="/membership" className="hover:text-black">Гишүүнчлэл</Link>
        </div>
      </div>
    </footer>
  );
}
