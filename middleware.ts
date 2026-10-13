import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthEnabled, isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

/**
 * Protected surface:
 *  - /admin/**        (pages)
 *  - /api/posts/**    (write APIs)
 *  - /api/upload      (write API)
 *  - /api/settings    (write API)
 *
 * When ADMIN_PASSWORD is not configured, everything stays open for local dev.
 */
export const config = {
  matcher: ["/admin/:path*", "/api/posts/:path*", "/api/upload/:path*", "/api/settings/:path*"],
};

export async function middleware(req: NextRequest): Promise<NextResponse> {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await isValidSessionToken(token);
  if (authed) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const login = new URL("/login", req.url);
  login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}