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
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");

  const earn = CREDIT_FOR_CONDITION[condition];

  function onFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, 3 - files.length);
    if (arr.length === 0) return;
    setFiles((p) => [...p, ...arr].slice(0, 3));
    arr.forEach((f) => {
      const r = new FileReader();
      r.onload = () => { if (typeof r.result === "string") setPreviews((p) => [...p, r.result as string].slice(0, 3)); };
      r.readAsDataURL(f);
    });
  }

  async function uploadAll(): Promise<string[]> {
    const urls: string[] = [];
    for (const f of files) {
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
    setBusy(true);
    try {
      setStep(files.length > 0 ? "Зураг upload хийж байна..." : "Нийтэлж байна...");
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
      <h1 className="text-2xl md:text-3xl font-extrabold text-navy">📸 Ном оруулах + кредит авах</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ковер, арын тал, дотор тал (max 3) оруулаад <b className="text-accent-dark">+{earn} кредит</b> авна.
      </p>

      <div className="mt-6 rounded-3xl border bg-white p-5 md:p-7 space-y-4">
        <div
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-paper p-6 text-center cursor-pointer hover:border-accent"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input id="file-input" type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => onFiles(e.target.files)} />
          {previews.length === 0 ? (
            <div>
              <div className="text-4xl">📷</div>
              <div className="mt-2 font-bold">Зураг сонгох (утас / компьютер)</div>
              <div className="text-xs text-slate-500">Ковер • Арын тал • Дотор тал (max 5MB/зураг)</div>
            </div>
          ) : (
            <div className="flex gap-2 justify-center flex-wrap">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-24 w-24 rounded-xl object-cover border" />
              ))}
              {previews.length < 3 && <span className="text-sm text-slate-400 self-center">+ нэмэх</span>}
            </div>
          )}
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
          {busy ? step || "Нийтэлж байна..." : `🚀 Нийтлэх + ${earn} кредит авах`}
        </button>
        <p className="text-xs text-slate-400 text-center">Нийтлэгдмэгц кредит орно, төлөв нь «Шалгагдаж байгаа» → админ зөвшөөрнө.</p>
      </div>
    </div>
  );
}
