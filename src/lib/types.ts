export type Category = "children" | "fiction" | "textbook";
export type Condition = "new" | "like_new" | "good" | "used";
export type Source = "official" | "user";
export type BookStatus = "pending" | "active" | "sold" | "rejected";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: Category;
  condition: Condition;
  description: string;
  source: Source;
  status: BookStatus;
  priceCash: number; // төгрөг, default 5000
  ownerName: string;
  images: string[]; // dataURL эсвэл /covers/...
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
}

export interface CreditTx {
  id: string;
  amount: number; // +орлого / -зарлага
  reason: string;
  bookTitle?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  bookId: string;
  bookTitle: string;
  cashPaid: number;
  creditSpent: number;
  createdAt: string;
}

export interface MockUser {
  name: string;
  email: string;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  children: "Хүүхдийн",
  fiction: "Уран зохиол",
  textbook: "Сурах бичиг",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  new: "Шинэ",
  like_new: "Шинэвтэр",
  good: "Дунд",
  used: "Ашигласан",
};

export const STATUS_LABEL: Record<BookStatus, string> = {
  pending: "Шалгагдаж байгаа",
  active: "Идэвхтэй",
  sold: "Зарагдсан",
  rejected: "Татгалзсан",
};

// ---- Credit Engine дүрэм (MVP prototype) ----
export const CREDIT_FOR_CONDITION: Record<Condition, number> = {
  new: 120,
  like_new: 100,
  good: 80,
  used: 60,
};
export const CREDIT_TO_MNT = 10; // 1 кредит = 10₮
export const MAX_CREDIT_PER_DAY = 3; // өдөрт max 3 пост кредит авна
export const MAX_CREDIT_USE_PER_ORDER = 200; // 1 захиалгад max 200 кредит = 2000₮ хөнгөлөлт
export const BASE_PRICE = 5000;
