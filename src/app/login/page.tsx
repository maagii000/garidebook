"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const sp = useSearchParams();
  const authError = sp.get("error");
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border bg-white p-7 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Тавтай морил</h1>
        {authError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            Нэвтрэхэд алдаа гарлаа ({authError}). Дахин оролдоно уу.
          </div>
        )}
        <p className="text-sm text-slate-500 mt-1">
          Level Up Hub-д Google хаягаараа нэвтэрнэ үү.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="mt-6 w-full rounded-xl border-2 border-slate-200 px-5 py-3.5 font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <span className="font-extrabold text-lg">G</span> Google-ээр нэвтрэх
        </button>

        <p className="mt-5 text-[11px] text-slate-400">
          Нэвтэрснээр ном худалдаж авах, хадгалах, чатлах боломжтой.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
