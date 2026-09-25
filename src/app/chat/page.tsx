"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
  topic: string;
  online: number;
  last: { text: string; userName: string; createdAt: string } | null;
}

interface Msg {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("mn-MN", { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (session?.user as { id?: string } | undefined)?.id;

  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.rooms)) {
          setRooms(d.rooms);
          if (d.rooms.length > 0) setRoomId((cur) => cur ?? d.rooms[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Polling 5с
  useEffect(() => {
    if (!roomId) return;
    let stop = false;
    const load = (after?: string) => {
      fetch(`/api/chat/rooms/${roomId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          if (stop || !Array.isArray(d.messages)) return;
          if (after) {
            if (d.messages.length > 0) setMsgs((p) => [...p, ...d.messages]);
          } else {
            setMsgs(d.messages);
          }
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(() => {
      setMsgs((p) => {
        const last = p[p.length - 1];
        if (last) load(last.createdAt);
        else load();
        return p;
      });
    }, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, roomId]);

  async function send() {
    const t = text.trim();
    if (!t || sending || !roomId) return;
    if (!session) { router.push("/login"); return; }
    setSending(true);
    const r = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    const d = await r.json();
    setSending(false);
    if (!r.ok) return;
    setText("");
    if (d.message) setMsgs((p) => [...p, d.message]);
  }

  const room = rooms.find((r) => r.id === roomId) ?? null;
  const filtered = q.trim()
    ? rooms.filter((r) => (r.name + " " + r.topic).toLowerCase().includes(q.toLowerCase()))
    : rooms;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="h-[calc(100vh-12rem)] min-h-[500px]">
        <div className="flex h-full bg-white border border-gray-100 rounded-[2rem] shadow-apple overflow-hidden">
          {/* Sidebar */}
          <div className={`${roomId ? "hidden" : "flex"} md:flex w-full md:w-1/3 border-r border-gray-100 flex-col bg-gray-50/50`}>
            <div className="p-6 pb-2 border-b border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-black">Хэлэлцүүлэг</h2>
              <div className="relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-3 top-2.5 text-gray-400">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text" placeholder="Хайх..."
                  className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-2">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoomId(r.id)}
                  className={`w-full text-left p-3 rounded-2xl cursor-pointer transition-colors flex items-center gap-3 ${
                    r.id === roomId ? "bg-brand/10 border-l-4 border-brand" : "border border-transparent hover:bg-white hover:border-gray-100"
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-xs shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`font-bold text-xs truncate ${r.id === roomId ? "text-black" : "text-gray-700"}`}>{r.name}</h4>
                      {r.last && <span className="text-[10px] text-gray-400 shrink-0">{fmtTime(r.last.createdAt)}</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {r.last ? `${r.last.userName}: ${r.last.text}` : r.topic || "Хоосон"}
                    </p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-sm text-slate-400 text-center">Өрөө олдсонгүй</div>
              )}
            </div>
          </div>

          {/* Main Chat */}
          {room ? (
            <div className={`${roomId ? "flex" : "hidden"} md:flex w-full md:w-2/3 flex-col bg-white`}>
              <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white/90">
                <div className="flex items-center gap-3">
                  <button onClick={() => setRoomId(null)} className="md:hidden" aria-label="буцах">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                    {room.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-black">{room.name}</h3>
                    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> {room.online} оюутан онлайн
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-[#FAFAFA] flex flex-col gap-4">
                {msgs.map((m) => {
                  const mine = myId && m.userId === myId;
                  const t = new Date(m.createdAt);
                  const time = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                  return (
                    <div key={m.id} className="flex flex-col">
                      <div className={`flex items-center gap-1.5 mb-1 ${mine ? "justify-end" : ""}`}>
                        <span className="text-[10px] font-bold text-slate-500">{mine ? "Та" : m.userName}</span>
                        <span className="text-[9px] text-slate-400/70">{time}</span>
                      </div>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs whitespace-pre-wrap break-words ${
                        mine
                          ? "self-end bg-brand text-white rounded-br-none shadow-md"
                          : "self-start bg-[#F5F5F7] text-black rounded-bl-none border border-gray-200/60"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                    type="text" placeholder="Мессеж бичих..."
                    maxLength={500}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors" />
                  <button onClick={send} disabled={sending || !text.trim()}
                    className="bg-brand text-white p-3 rounded-full shadow-md hover:bg-brand-dark transition-colors disabled:opacity-50" aria-label="илгээх">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex w-2/3 items-center justify-center text-sm text-slate-400">
              Өрөө сонгоно уу
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
