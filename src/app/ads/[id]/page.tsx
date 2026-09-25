"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface AdDetail {
  id: string;
  title: string;
  price: number;
  description: string;
  contact: string;
  status: string;
  ownerName: string;
  images: string[];
}

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [img, setImg] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/ads/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ad) setAd(d.ad); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function markSold() {
    if (!ad) return;
    setBusy(true);
    const r = await fetch(`/api/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sold" }),
    });
    setBusy(false);
    if (r.ok) {
      setAd({ ...ad, status: "sold" });
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Ачааллаж байна...</div>;
  if (!ad) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Зар олдсонгүй</h1>
        <Link href="/ads" className="mt-4 inline-block font-bold text-accent-dark hover:underline">← Зарууд руу буцах</Link>
      </div>
    );
  }

  const cover = ad.images[img] ?? ad.images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/ads" className="text-sm font-bold text-slate-500">← Зарууд</Link>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={ad.title} className="h-96 w-full object-cover" />
          ) : (
            <div className="h-96 grid place-items-center bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-center">
              <div className="text-2xl font-extrabold text-white">{ad.title}</div>
            </div>
          )}
          {ad.images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {ad.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" onClick={() => setImg(i)}
                  className={`h-16 w-16 rounded-lg object-cover border cursor-pointer ${i === img ? "ring-2 ring-navy" : ""}`} />
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-bold text-accent-dark">Хэрэглэгчийн зар</span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">{ad.title}</h1>
          <div className="text-slate-500">Нийлүүлэгч: {ad.ownerName}</div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{ad.description || "Тайлбар бичигдээгүй."}</p>

          <div className="mt-5 rounded-2xl border bg-white p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold">ҮНЭ</div>
              <div className="text-3xl font-extrabold text-navy">{ad.price.toLocaleString()}₮</div>
            </div>
            {session && ad.status !== "sold" && (
              <a href={`tel:${ad.contact}`} className="rounded-xl bg-sage px-5 py-3 font-bold text-white">
                Холбогдох
              </a>
            )}
          </div>
          {ad.status === "sold" && (
            <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-500">Зарагдсан</div>
          )}
          {!session && (
            <p className="mt-2 text-xs text-slate-500 text-center">Холбоо барих дугаарыг харахын тулд нэвтэрнэ үү.</p>
          )}
          {session?.user?.name === ad.ownerName && ad.status === "active" && (
            <button onClick={markSold} disabled={busy}
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50">
              {busy ? "Хадгалж байна..." : "Зарагдсан гэж тэмдэглэх"}
            </button>
          )}
          <button onClick={() => router.push("/ads/new")}
            className="mt-3 w-full rounded-xl bg-navy px-4 py-3 text-sm font-extrabold text-white hover:bg-navy-dark">
            Өөр зар байршуулах (500₮)
          </button>
        </div>
      </div>
    </div>
  );
}
