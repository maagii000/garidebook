import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", verifyRequest: "/login?verify=1" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Google email is verified → safe to link with existing seed/admin account
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: { host: "smtp.resend.com", port: 587, auth: { user: "resend", pass: process.env.RESEND_API_KEY || "" } },
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      // Use Resend HTTP API instead of SMTP (works on Vercel serverless)
      sendVerificationRequest: async ({ identifier, url }) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: identifier,
            subject: "Garidebook — нэвтрэх холбоос",
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2>Сайн байна уу! 👋</h2>
              <p>Garidebook-д нэвтрэх холбоос:</p>
              <p><a href="${url}" style="display:inline-block;background:#FF7A00;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">Нэвтрэх</a></p>
              <p style="color:#888;font-size:12px">Холбоос 24 цаг хүчинтэй. Та хүсээгүй бол тооно уу.</p>
            </div>`,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend failed: ${body}`);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, credit: true },
        });
        token.role = u?.role ?? "USER";
        token.credit = u?.credit ?? 120;
      } else if (token.sub) {
        // refresh role/credit on each request (cheap single-row lookup)
        const u = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, credit: true },
        });
        if (u) {
          token.role = u.role;
          token.credit = u.credit;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        (session.user as { role?: string }).role = (token.role as string) ?? "USER";
        (session.user as { credit?: number }).credit = (token.credit as number) ?? 0;
      }
      return session;
    },
  },
};
