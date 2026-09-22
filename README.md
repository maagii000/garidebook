# Garidebook — Ном солилцох кредит платформ (Prototype / MVP)

Сурагчид уншсан номын зургаа оруулаад **кредит** цуглуулж, **кредит + мөнгөөр (~5,000₮)**
ном хямд авдаг P2P маркетплейс. UFE Entrepreneurship хичээлийн төсөл.

## ⚡ Хурдан эхлүүлэх

```bash
npm install
npm run dev
# http://localhost:3000
```

Build шалгах:

```bash
npm run build
npm start
```

## 🗺 Хуудсууд

| Хуудас | Тайлбар |
|---|---|
| `/` | Landing + UFE value + хэрхэн ажилладаг + онцлох номууд |
| `/catalog` | Хоёр таб (Garidebook Stock / P2P) + хайлт + ангилал + эрэмбэ |
| `/books/[id]` | Gallery + ревью (1–5 од) + wishlist + checkout CTA |
| `/books/new` | 3 зураг upload + нэр/зохиолч/ангилал/төлөв → авто-кредит |
| `/profile` | Кредит үлдэгдэл + түүх + захиалгууд |
| `/my-books` | Миний номууд + төлөв шүүлтүүр (pending/active/sold) |
| `/wishlist` | Хадгалсан номууд |
| `/checkout/[id]` | Кредит slider + бэлэн тооцоо (mock төлбөр) |
| `/admin` | Pending approve/reject + бүх ном удирдах |
| `/login`, `/register` | Mock auth (нэр + email, localStorage) |

## 💳 Credit Engine (MVP дүрэм)

- `Шинэ +120`, `Шинэвтэр +100`, `Дунд +80`, `Ашигласан +60` — `src/lib/types.ts`
- Өдөрт max **3** пост кредит авна (спам хамгаалалт)
- `1 кредит = 10₮` хөнгөлөлт, 1 захиалгад max **200 кредит (2,000₮)**
- Суурь үнэ: **5,000₮** (`BASE_PRICE`)
- Бүртгүүлмэгц +120 тавтай морил кредит
- Дата: `localStorage` (`garidebook-*`), `↺ Демо reset` профайл дээр

Логик: `src/lib/store.tsx` → `addBook()`, `checkout()`, `addReview()`

## 🎨 Дизайн

- Navy `#1E3A8A`, Paper `#FDFBF7`, Accent `#FF7A00`, Sage `#10B981`
- Tailwind v4 `@theme` — `src/app/globals.css`
- Mobile-first, card grid, монгол хэл UI

## 🧪 Багшийн демо (5 минут)

1. `/` → хэрхэн ажилладаг + UFE блок үзүүлэх
2. `/catalog` → Stock vs P2P таб + шүүлтүүр
3. `/register` → +120 кредит авснаа `/profile` дээр харуул
4. `/books/new` → зураг оруулж +кредит (my-books → pending)
5. `/admin` → pending-г Approve → active
6. `/books/[id]` → ревью бичих + ♡ хадгалах
7. `/checkout/[id]` → кредит slider → захиалах → profile дээр түүх

## 🔌 Бодит хувилбарт шилжих (roadmap)

- **DB:** Prisma + PostgreSQL (Supabase/Neon). `Book/Review/CreditTx/Order` schema
  `src/lib/types.ts`-тай 1:1 таарна — store-г API route-оор солиход хангалттай.
- **Auth:** NextAuth (email OTP + Google + утас). Одоо mock.
- **Зураг:** Cloudinary unsigned upload → `book.images[]` URL хадгална.
  Одоо FileReader dataURL (демо-д хангалттай).
- **Төлбөр:** QPay / Stripe — `checkout()` дотор `cashPaid` тооцоо бэлэн.
- **Deploy:** Vercel → GitHub push → `vercel --prod`.

## 📁 Бүтэц

```
src/app/ (landing, catalog, books, checkout, profile, admin, login...)
src/components/ (Header, Footer, BookCard, RatingStars)
src/lib/ types.ts (дүрэм) / data.ts (12 seed ном) / store.tsx (engine)
```
