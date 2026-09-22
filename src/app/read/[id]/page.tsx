"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [url, setUrl] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [err, setErr] = useState("");
  const [goto, setGoto] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      const w = es[0]?.contentRect.width ?? 0;
      if (w > 0) setWrapW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    fetch(`/api/books/${id}/pdf`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setErr(d.error || "Нээх боломжгүй");
        else setUrl(d.url);
      })
      .catch(() => setErr("Сүлжээний алдаа"));
  }, [id]);

  const onDoc = useCallback((d: { numPages: number }) => setPages(d.numPages), []);
  const go = (p: number) => setPage(Math.max(1, Math.min(pages || 1, p)));
  const email = session?.user?.email ?? "";

  if (err) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-3 text-xl font-extrabold">{err}</h1>
        <Link href={`/checkout/${id}`} className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 font-bold text-white">
          Худалдаж авах
        </Link>
      </div>
    );
  }
  if (!url) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-500">📖 Ном нээгдэж байна...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 select-none" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3 sticky top-16 z-30 shadow-sm">
        <Link href={`/books/${id}`} className="text-sm font-bold text-slate-500 hover:text-accent-dark">← Ном</Link>
        <button onClick={() => go(page - 1)} disabled={page <= 1} className="rounded-lg border px-3 py-1.5 text-sm font-bold disabled:opacity-40">‹</button>
        <span className="text-sm font-bold">
          <input value={goto} onChange={(e) => setGoto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { go(Number(goto) || 1); setGoto(""); } }}
            placeholder={String(page)} className="w-12 rounded border px-1.5 py-1 text-center text-sm" />
          {" "}/ {pages}
        </span>
        <button onClick={() => go(page + 1)} disabled={page >= pages} className="rounded-lg border px-3 py-1.5 text-sm font-bold disabled:opacity-40">›</button>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="rounded-lg border px-2.5 py-1.5 text-sm font-bold">−</button>
          <span className="text-xs font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))} className="rounded-lg border px-2.5 py-1.5 text-sm font-bold">+</button>
          <Link href={`/books/${id}#ai`} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white">🤖 AI</Link>
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-4 flex justify-center overflow-hidden" onCopy={(e) => e.preventDefault()}>
        <Document file={url} onLoadSuccess={onDoc} loading={<div className="py-20 text-slate-400">Хуудас ачааллаж байна...</div>}>
          <Page
            pageNumber={page}
            width={wrapW > 0 ? Math.floor(Math.min(wrapW, 700) * zoom) : undefined}
            renderAnnotationLayer renderTextLayer={false}
          />
        </Document>
        {/* Watermark */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[15, 45, 75].map((top) => (
            <div key={top} className="absolute w-full text-center font-bold text-slate-900/10 text-xl"
              style={{ top: `${top}%`, transform: "rotate(-25deg)" }}>
              {email}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        Татаж авах, хэвлэх боломжгүй хамгаалагдсан хувилбар. Хуудас {page}/{pages}
      </p>
    </div>
  );
}
