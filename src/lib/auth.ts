import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Google email is verified → safe to link with existing seed/admin account
      allowDangerousEmailAccountLinking: true,
    }),
    // NOTE: Email magic-link removed (Google-only for now).
    // To re-enable: add EmailProvider + GMAIL_USER/GMAIL_APP_PASSWORD (App Password).
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
