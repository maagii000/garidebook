import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      credit?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    credit?: number;
  }
}
