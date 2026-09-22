// Seed: 12 demo book + users + reviews + admin
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BOOKS = [
  { id: "g1", title: "Монгол ардын үлгэрүүд", author: "Эмхэтгэсэн: Д. Цэрэндагва", category: "children", condition: "like_new", description: "Бага ангийн сурагчдад хамгийн тохиромжтой, зурагтай үлгэрүүд.", source: "official", status: "active", owner: "Garidebook Stock", rating: 4.8, count: 24 },
  { id: "g2", title: "Харри Поттер ба Философийн чулуу", author: "Ж.К. Роулинг", category: "fiction", condition: "good", description: "Монгол орчуулга, 2 удаа уншсан, хавтас сайн.", source: "user", status: "active", owner: "Анужин (10-р анги)", rating: 4.9, count: 41 },
  { id: "g3", title: "Физик 10-р анги", author: "БШУЯ сурах бичиг", category: "textbook", condition: "good", description: "Сурах бичиг, тэмдэглэл багатай, шалгалтад бэлдэхэд сайн.", source: "user", status: "active", owner: "Тэмүүлэн (11-р анги)", rating: 4.2, count: 9 },
  { id: "g4", title: "Бяцхан ханхүү", author: "Антуан де Сент-Экзюпери", category: "fiction", condition: "new", description: "Шинэ шахам, бэлгэнд өгөхөд тохиромжтой.", source: "official", status: "active", owner: "Garidebook Stock", rating: 4.7, count: 33 },
  { id: "g5", title: "Математик 9-р анги бодлогын хураамж", author: "Д. Оюунчимэг", category: "textbook", condition: "used", description: "Ашигласан ч дутуу хуудасгүй, бодлого ихтэй.", source: "user", status: "active", owner: "Билгүүн (9-р анги)", rating: 4.0, count: 6 },
  { id: "g6", title: "Дэлхийн түүх хүүхдэд", author: "Орчуулгын баг", category: "children", condition: "like_new", description: "Зурагтай, том үсэгтэй, уншихад хялбар.", source: "official", status: "active", owner: "Garidebook Stock", rating: 4.5, count: 12 },
  { id: "g7", title: "Алхимич", author: "Пауло Коэльо", category: "fiction", condition: "good", description: "Оюутнуудын дуртай, урам зориг өгдөг ном.", source: "user", status: "pending", owner: "Сарнай (МУИС)", rating: 4.6, count: 18 },
  { id: "g8", title: "Англи хэлний үгсийн сан 1000", author: "Б. Нарангарав", category: "textbook", condition: "new", description: "Шинэ, EJU / IELTS-д бэлдэгчдэд тохиромжтой.", source: "official", status: "active", owner: "Garidebook Stock", rating: 4.4, count: 15 },
  { id: "g9", title: "Том Сойерын адал явдал", author: "Марк Твен", category: "children", condition: "good", description: "Хүүхдийн сонгодог, орчуулга сайн.", source: "user", status: "active", owner: "Хүслэн (8-р анги)", rating: 4.6, count: 11 },
  { id: "g10", title: "1984", author: "Жорж Оруэлл", category: "fiction", condition: "used", description: "Ахлах анги, оюутанд заавал унших ном.", source: "user", status: "active", owner: "Энхжин (12-р анги)", rating: 4.7, count: 27 },
  { id: "g11", title: "Хими 11-р анги", author: "БШУЯ сурах бичиг", category: "textbook", condition: "like_new", description: "Шинэвтэр, хавтас нугалаагүй.", source: "user", status: "sold", owner: "Дөлгөөн", rating: 4.1, count: 5 },
  { id: "g12", title: "Шидэт мозайк үлгэр", author: "О. Сүнжидмаа", category: "children", condition: "new", description: "Цэцэрлэг, бага ангийн хүүхдэд зориулсан.", source: "official", status: "active", owner: "Garidebook Stock", rating: 4.3, count: 8 },
];

const REVIEWS = [
  { bookId: "g2", user: "Бат-Эрдэнэ", rating: 5, text: "Орчуулга нь маш ойлгомжтой, хүү маань 2 хоногт уншиж дуусгасан." },
  { bookId: "g2", user: "Мишээл", rating: 5, text: "Хавтас нь бодсоноос цэвэрхэн ирсэн. Кредитээр хямд авсан." },
  { bookId: "g4", user: "Оюука", rating: 5, text: "Бэлгэнд өгсөн, маш гоё хавтастай." },
];

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "margarderdene455@gmail.com";

async function userByName(name, extra = {}) {
  const email = `${name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 12) || "user"}@seed.local`;
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, ...extra },
  });
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: { name: "Админ", email: ADMIN_EMAIL, role: "ADMIN", credit: 500 },
  });
  console.log("admin:", admin.email);

  const ownerCache = {};
  for (const b of BOOKS) {
    if (!ownerCache[b.owner]) ownerCache[b.owner] = await userByName(b.owner);
    await prisma.book.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id, title: b.title, author: b.author,
        category: b.category, condition: b.condition,
        description: b.description, source: b.source, status: b.status,
        priceCash: 5000, ownerId: ownerCache[b.owner].id,
        avgRating: b.rating, reviewCount: b.count,
      },
    });
  }
  console.log("books: 12");

  for (const r of REVIEWS) {
    const u = await userByName(r.user);
    await prisma.review.upsert({
      where: { bookId_userId: { bookId: r.bookId, userId: u.id } },
      update: {},
      create: { bookId: r.bookId, userId: u.id, rating: r.rating, text: r.text },
    });
  }
  console.log("reviews: 3");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
