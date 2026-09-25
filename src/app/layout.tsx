import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Level Up Hub — Ном солилцох кредит платформ",
  description:
    "Уншсан номоо оруулж кредит цуглуул, кредит + мөнгөөр хямд ном ав. ЕБС сурагч, оюутанд зориулсан P2P номын маркетплейс.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className="h-full">
      <body className="min-h-full flex flex-col bg-paper text-slate-800 antialiased relative">
        {/* Blob дэвсгэр (Level Hub хэл) */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/40 mix-blend-multiply blur-[100px] animate-blob" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gray-200/50 mix-blend-multiply blur-[100px] animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-slate-100/60 mix-blend-multiply blur-[120px] animate-blob" style={{ animationDelay: "4s" }} />
        </div>
        <AuthProvider>
          <StoreProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
