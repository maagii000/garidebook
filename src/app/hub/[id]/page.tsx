"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import PayModal from "@/components/PayModal";

interface HubDetail {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName: string;
  fileSize: number;
  price: number;
  ownerName: string;
  canAccess: boolean;
}

export default function HubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [m, setM] = useState<HubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`/api/hub/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.material) setM(d.material); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(load, [id]);

  async function download() {
    if (!m) return;
    setBusy(true);
    const r = await fetch(`/api/hub/${id}/file`).then((x) => x.json());
    setBusy(false);
    if (r.url) {
      window.open(r.url, "_blank");
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Ачааллаж байна...</div>;
  if (!m) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Материал олдсонгүй</h1>
        <Link href="/hub" className="mt-4 inline-block font-bold text-accent-dark hover:underline">← Сан руу буцах</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/hub" className="text-sm font-bold text-slate-500">← Мэдлэгийн сан</Link>
      <div className="mt-4 rounded-3xl border bg-white p-6 md:p-8">
        <span className="rounded-md bg-navy-light px-2.5 py-1 text-xs font-bold text-navy">
          {m.subject || "Ерөнхий"}
        </span>
        <h1 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">{m.title}</h1>
        <div className="mt-1 text-sm text-slate-500">
          {m.fileName} • Оруулсан: {m.ownerName}
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-600 whitespace-pre-wrap">
          {m.description || "Тайлбар бичигдээгүй."}
        </p>

        <div className="mt-6 rounded-2xl bg-paper border p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400 font-bold">ҮНЭ</div>
            <div className={`text-2xl font-extrabold ${m.price > 0 ? "text-navy" : "text-emerald-600"}`}>
              {m.price > 0 ? `${m.price.toLocaleString()}₮` : "Үнэгүй"}
            </div>
          </div>
          {m.canAccess ? (
            <button onClick={download} disabled={busy}
              className="rounded-xl bg-sage px-5 py-3 font-bold text-white disabled:opacity-50">
              {busy ? "Нээж байна..." : "Файл татах / нээх"}
            </button>
          ) : (
            <button
              onClick={() => { if (!session) { router.push("/login"); return; } setShowPay(true); }}
              className="rounded-xl bg-accent px-5 py-3 font-extrabold text-white hover:bg-accent-dark">
              Худалдаж авах
            </button>
          )}
        </div>
        {!m.canAccess && m.price > 0 && (
          <p className="mt-2 text-xs text-slate-400 text-center">Төлсний дараа татах эрх нээгдэнэ.</p>
        )}
      </div>

      {showPay && (
        <PayModal
          title={m.title}
          amount={m.price}
          description={`Garidebook Hub: ${m.title}`.slice(0, 60)}
          purpose="MATERIAL"
          refId={m.id}
          onPaid={() => { setShowPay(false); load(); }}
          onClose={() => setShowPay(false)}
        />
      )}
    </div>
  );
}
