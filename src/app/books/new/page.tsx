"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Category, Condition, CREDIT_FOR_CONDITION } from "@/lib/types";

export default function NewBookPage() {
  const router = useRouter();
  const { addBook, notify } = useStore();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<Category>("fiction");
  const [condition, setCondition] = useState<Condition>("good");
  const [description, setDescription] = useState("");
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
  const [files, setFiles] = useState<(File | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");

  const earn = CREDIT_FOR_CONDITION[condition];
  const SLOTS = ["Ковер", "Ар тал", "Дотор тал"];

  function onSlotFile(i: number, list: FileList | null) {
    const f = list?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFiles((p) => { const n = [...p]; n[i] = f; return n; });
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === "string")
        setPreviews((p) => { const n = [...p]; n[i] = r.result as string; return n; });
    };
    r.readAsDataURL(f);
  }

  function clearSlot(i: number) {
    setFiles((p) => { const n = [...p]; n[i] = null; return n; });
    setPreviews((p) => { const n = [...p]; n[i] = null; return n; });
  }

  async function uploadAll(): Promise<string[]> {
    const urls: string[] = [];
    for (const f of files) {
      if (!f) continue;
      const form = new FormData();
      form.append("file", f);
      const r = await fetch("/api/uploads", { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Зураг upload амжилтгүй");
      urls.push(d.url);
    }
    return urls;
  }

  async function submit() {
    if (!title.trim() || !author.trim()) { notify("Нэр + зохиолчоо бөглөнө үү", "err"); return; }
    if (!files[0]) { notify("Ковер зураг заавал оруулна", "err"); return; }
    setBusy(true);
    try {
      setStep("Зураг upload хийж байна...");
      const urls = await uploadAll();
      setStep("Нийтэлж байна...");
      const res = await addBook({
        title: title.trim(), author: author.trim(), category, condition,
        description: description.trim(), images: urls,
      });
      if ("error" in res) { notify(res.error, "err"); return; }
      notify(`Амжилттай! +${res.earned} кредит авлаа ✓`);
      router.push("/my-books");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Алдаа гарлаа", "err");
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Ном оруулах + кредит авах</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ковер, арын тал, дотор тал (max 3) оруулаад <b className="text-accent-dark">+{earn} кредит</b> авна.
      </p>

      <div className="mt-6 rounded-3xl border bg-white p-5 md:p-7 space-y-4">
        <div>
          <div className="text-sm font-bold">Зураг <span className="text-slate-400 font-normal">(эхнийх нь каталогт ковер болж харагдана)</span></div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {SLOTS.map((label, i) => (
              <div key={label}>
                <div className="mb-1.5 text-xs font-bold text-slate-600">
                  {i + 1}. {label} {i === 0 && <span className="text-red-500">*</span>}
                </div>
                <div
                  onClick={() => document.getElementById(`file-input-${i}`)?.click()}
                  className={`relative grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                    previews[i] ? "border-transparent" : "border-slate-300 bg-paper hover:border-accent"
                  }`}
                >
                  <input id={`file-input-${i}`} type="file" accept="image/*" className="hidden"
                    onChange={(e) => onSlotFile(i, e.target.files)} />
                  {previews[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[i]!} alt={label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center px-2">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mx-auto text-slate-400">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <div className="mt-1 text-[11px] font-bold text-slate-500">Нэмэх</div>
                      <div className="text-[10px] text-slate-400">max 5MB</div>
                    </div>
                  )}
                </div>
                {previews[i] && (
                  <button onClick={() => clearSlot(i)} className="mt-1 w-full text-[11px] font-bold text-slate-400 hover:text-red-500">
                    Устгах
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold">Номын нэр *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ж: Бяцхан ханхүү"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Зохиолч *</span>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ж: Экзюпери"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold">Ангилал</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white">
              <option value="children">Хүүхдийн</option>
              <option value="fiction">Уран зохиол</option>
              <option value="textbook">Сурах бичиг</option>
              <option value="self_help">Хувь хүний хөгжил</option>
              <option value="biography">Намтар</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold">Ашиглалтын төлөв (кредит үүнээс хамаарна)</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white">
              <option value="new">Шинэ (+120)</option>
              <option value="like_new">Шинэвтэр (+100)</option>
              <option value="good">Дунд (+80)</option>
              <option value="used">Ашигласан (+60)</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold">Тайлбар</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="Хэдэн удаа уншсан, хавтас/хуудасны байдал..."
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
        </label>

        <button onClick={submit} disabled={busy}
          className="w-full rounded-xl bg-accent px-5 py-3.5 font-extrabold text-white hover:bg-accent-dark disabled:opacity-50">
          {busy ? step || "Нийтэлж байна..." : `Нийтлэх + ${earn} кредит авах`}
        </button>
        <p className="text-xs text-slate-400 text-center">Нийтлэгдмэгц кредит орно, төлөв нь «Шалгагдаж байгаа» → админ зөвшөөрнө.</p>
      </div>
    </div>
  );
}
