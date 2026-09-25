import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CANONICAL_HOST = "blackup.ink";

const PROTECTED = [
  "/profile",
  "/my-books",
  "/wishlist",
  "/books/new",
  "/checkout",
  "/read",
  "/admin",
  "/ads/new",
  "/hub/new",
  "/chat",
  "/match",
];

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Canonical domain redirect (API-ээс бусад — QPay callback POST хадгалахын тулд)
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  if (host && host !== CANONICAL_HOST && !isLocal && !pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // 2. Auth — зөвхөн хамгаалагдсан замд
  if (!isProtected(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && (token.role as string) !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
