"use client";

import { useState } from "react";

interface Msg {
  role: "user" | "ai";
  text: string;
}

export default function AiChat({ bookId }: { bookId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setMsgs((p) => [...p, { role: "user", text: question }]);
    setQ("");
    try {
      const r = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, question }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsgs((p) => [...p, { role: "ai", text: `⚠️ ${d.error || "Алдаа гарлаа"}` }]);
      } else {
        setMsgs((p) => [...p, { role: "ai", text: d.answer }]);
        setRemaining(d.remaining ?? null);
      }
    } catch {
      setMsgs((p) => [...p, { role: "ai", text: "⚠️ Сүлжээний алдаа" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="ai" className="mt-6 rounded-3xl border-2 border-accent/40 bg-white p-5 scroll-mt-24">
      <h2 className="text-xl font-extrabold text-navy">🤖 Номын AI-аас асуух</h2>
      <p className="text-xs text-slate-500 mt-1">
        AI номыг уншиж, асуусан мэдээллийг чинь олж өгнө.
        {remaining !== null && ` (өдөрт ${remaining} үлдсэн)`}
      </p>
      <div className="mt-3 space-y-2.5 max-h-96 overflow-auto">
        {msgs.length === 0 && (
          <div className="rounded-xl bg-paper border p-4 text-sm text-slate-500">
            Жишээ: «Энэ номын гол санаа юу вэ?», «Зохиогч юу зөвлөсөн бэ?»
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-xl px-3.5 py-2.5 text-sm leading-6 whitespace-pre-wrap ${
            m.role === "user" ? "bg-navy-light text-navy ml-8" : "bg-paper border mr-8"
          }`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-sm text-slate-400 animate-pulse">AI бодож байна...</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder="Номноос асуух..."
          className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
        <button onClick={ask} disabled={busy || !q.trim()}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-extrabold text-white hover:bg-accent-dark disabled:opacity-50">
          Асуух
        </button>
      </div>
    </div>
  );
}
