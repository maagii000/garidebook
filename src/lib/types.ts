export type Category = "children" | "fiction" | "textbook" | "self_help" | "biography";
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
  // Ebook fields (physical P2P listing бол undefined)
  hasPdf?: boolean;
  hasAi?: boolean;
  pages?: number;
  coverUrl?: string;
  owned?: boolean; // нэвтэрсэн хэрэглэгч худалдаж авсан эсэх
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
  self_help: "Хувь хүний хөгжил",
  biography: "Намтар",
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

// ---- Үнийн суурь (MVP prototype) ----
export const BASE_PRICE = 5000;
