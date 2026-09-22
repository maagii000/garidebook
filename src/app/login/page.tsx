"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border bg-white p-7 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Тавтай морил 👋</h1>
        <p className="text-sm text-slate-500 mt-1">
          Garidebook-д Google хаягаараа нэвтэрч кредитээ удирдаарай.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="mt-6 w-full rounded-xl border-2 border-slate-200 px-5 py-3.5 font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <span className="font-extrabold text-lg">G</span> Google-ээр нэвтрэх
        </button>

        <p className="mt-5 text-[11px] text-slate-400">
          Бүртгүүлмэгц +120 кредит бэлгэнд олгоно (анхны нэвтрэлтээр).
        </p>
      </div>
    </div>
  );
}
