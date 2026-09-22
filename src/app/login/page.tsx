"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginInner() {
  const sp = useSearchParams();
  const verify = sp.get("verify") === "1";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border bg-white p-7">
        <h1 className="text-2xl font-extrabold text-navy">Тавтай морил 👋</h1>
        <p className="text-sm text-slate-500 mt-1">
          {verify || sent
            ? "Email-ээ шалгаарай — нэвтрэх холбоос илгээгдсэн. 📩"
            : "Google эсвэл email холбоосоор нэвтэрч кредитээ удирдаарай."}
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="mt-5 w-full rounded-xl border-2 border-slate-200 px-5 py-3 font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <span className="font-extrabold text-lg">G</span> Google-ээр нэвтрэх
        </button>

        <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> эсвэл email холбоосоор <span className="h-px flex-1 bg-slate-200" />
        </div>

        <label className="block text-sm font-bold">И-мэйл
          <input
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.mn"
            type="email"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-normal outline-none focus:border-accent"
          />
        </label>
        <button
          disabled={busy}
          onClick={async () => {
            if (!email.includes("@")) return alert("И-мэйлээ зөв бичнэ үү");
            setBusy(true);
            await signIn("email", { email: email.trim(), callbackUrl: "/profile" });
            setBusy(false);
            setSent(true);
          }}
          className="mt-3 w-full rounded-xl bg-navy px-5 py-3 font-bold text-white hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? "Илгээж байна..." : "📩 Нэвтрэх холбоос авах"}
        </button>
        <p className="mt-4 text-[11px] text-slate-400 text-center">
          Бүртгүүлмэгц +120 кредит бэлгэнд олгоно (анхны нэвтрэлтээр).
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
