# Level Up Hub — Ном солилцох кредит платформ (Production)

Сурагчид уншсан номын зургаа оруулаад **кредит** цуглуулж, **кредит + мөнгөөр (~5,000₮)**
ном хямд авдаг P2P маркетплейс. UFE Entrepreneurship хичээлийн төсөл.

**Stack:** Next.js 16 + Tailwind v4 · PostgreSQL (Supabase, Prisma ORM) · NextAuth
(Google OAuth + Email magic link) · Supabase Storage (зураг) · Vercel deploy.

## ⚡ Локал ажиллуулах

```bash
npm install
cp .env.local.example .env.local   # түлхүүрүүдээ бөглө (доорх жагсаалт)
cp .env.local .env                 # Prisma CLI-д хэрэгтэй
npx prisma migrate dev
npx prisma db seed
node scripts/setup-storage.mjs     # book-images bucket (1 удаа)
npm run dev
# http://localhost:3000
```

## 🔑 Env хувьсагчид

| Хувьсагч | Хаанаас |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API Keys (secret, нууц!) |
| `DATABASE_URL` (pooler 6543) | Supabase → Connect → ORM/Prisma → Transaction pooler |
| `DIRECT_URL` (5432) | Supabase → Connect → ORM/Prisma → Session/direct |
| `NEXTAUTH_URL` | Локал: `http://localhost:3000`; Vercel: production URL |
| `NEXTAUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `RESEND_API_KEY`, `EMAIL_FROM` | resend.com → API Keys |
| `ADMIN_EMAIL` | Анхны админ хэрэглэгчийн email (seed) |

`.env*` gitignore-д — GitHub-д хэзээ ч орохгүй. Vercel → Project → Settings → Environment Variables-д хийнэ.

## ☁️ Vercel deploy

1. vercel.com → Add New → Project → `maagii000/garidebook` Import
2. Environment Variables дээрх 11 хувьсагчийг нэм → Deploy
3. Deploy дуусаад production URL-ээ ав → `NEXTAUTH_URL`-ээ тэр URL-ээр шинэчил → Redeploy
4. Google Cloud Console → Credentials → `garidebook-web` → Redirect URI нэм:
   `https://<vercel-url>/api/auth/callback/google`
5. Schema өөрчлөгдвөл: `npx prisma migrate dev` (локал) → push → Vercel автоматаар deploy
   (DB migrate Vercel дээр автоматаар гүйхгүй — гараар хийнэ)

## 💳 Credit Engine дүрэм

- `Шинэ +120`, `Шинэвтэр +100`, `Дунд +80`, `Ашигласан +60` — `src/lib/types.ts` + `POST /api/books`
- Өдөрт max **3** пост кредит авна (сервер талд шалгана)
- `1 кредит = 10₮` хөнгөлөлт, 1 захиалгад max **200 кредит (2,000₮)** — `POST /api/orders` (Prisma transaction)
- Суурь үнэ: **5,000₮**; шинэ хэрэглэгч +120 кредит (DB default)
- Төлбөр: бэлэн/шилжүүлэг (COD) — QPay дараагийн шатанд

## 🗺 Хуудсууд + хамгаалалт

`/`, `/catalog`, `/books/[id]`, `/login` — public.
`/profile`, `/my-books`, `/wishlist`, `/books/new`, `/checkout/*` — нэвтрэлт (`middleware.ts`).
`/admin` — зөвхөн `ADMIN` role (middleware + API `requireAdmin`).

## 🧪 Багшийн демо (5 минут)

1. `/` → UFE value + хэрхэн ажилладаг
2. Google-ээр нэвтрэх → `/profile` (+120 кр)
3. `/books/new` → зураг upload → +кредит (pending)
4. `/admin` (admin email-ээр) → Approve → active
5. `/books/[id]` → ревью + ♡ → `/checkout/[id]` slider → захиалах → profile түүх

## 📁 Бүтэц

```
prisma/ (schema + migrations + seed.mjs)
src/app/ (хуудсууд) + src/app/api/ (books/reviews/wishlist/credits/orders/uploads/admin/auth/payments/ai)
src/lib/ (db, auth, api-auth, supabase-server, store, types, qpay, payments, retrieval, deepseek)
middleware.ts (auth gate) · scripts/setup-storage.mjs · scripts/ingest-books.mjs
```

## 📕 Ebooks + AI + QPay (v2)

- **Номнууд:** `C:\Users\asus\Desktop\номууд`-ийн 6 PDF → `ebooks` private bucket +
  `BookChunk` (хуудасны дугаартай) → `node scripts/ingest-books.mjs`
- **Reader:** `/read/[id]` — PDF.js, download/print хаалттай, watermark, 10-минутын
  signed URL (`GET /api/books/[id]/pdf`). Зөвхөн худалдаж авсан + admin.
- **AI Q&A:** `POST /api/ai/ask` — keyword retrieval (top-5 chunk) + DeepSeek
  (`deepseek-flash` reasoning → `reasoning_content` fallback). Өдөрт 30 асуулт/хэрэглэгч.
  Env: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL`.
- **QPay sandbox:** `TEST_MERCHANT/123456`, `TEST_INVOICE`. Flow:
  `POST /api/payments` (invoice+QR) → polling `GET /api/payments/[id]` →
  `payment/check` → PAID → Order + кредит хасалт + ebarimt оролдлого.
  Callback: `GET /api/payments/qpay-callback?pid=...` (QPay дуудна).
  Env: `QPAY_HOST/USERNAME/PASSWORD/INVOICE_CODE/EB_INVOICE_CODE/TAX_TYPE/DISTRICT_CODE/EB_PATH`.
  Production эрх ирэхэд эдгээрийг солиход хангалттай.
- **Ebarimt:** `ebarimt_v3/create` (fallback `v2`) — QPay идэвхжүүлэлт шаарддаг;
  бүтэлгүйтвэл admin console-оос «Ebarimt дахин» товчоор retry.
- **Admin:** `/admin` 4 таб — Номууд (approve + үнэ), Ном нэмэх (PDF upload +
  browser текст задлал + chunk), Төлбөрүүд, AI статистик.
