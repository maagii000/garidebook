import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Garidebook — Ном солилцох кредит платформ",
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
      <body className="min-h-full flex flex-col bg-paper text-slate-800">
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
