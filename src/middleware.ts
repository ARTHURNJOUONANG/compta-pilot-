import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSessionCookieValue } from "@/lib/session-token";

function clearAuthCookies(res: NextResponse) {
  res.cookies.delete("session");
  res.cookies.delete("userId");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("session")?.value;
  const authenticated = await isValidSessionCookieValue(session);
  const hasStaleCookies =
    Boolean(session || req.cookies.get("userId")?.value) && !authenticated;

  if (
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/health") ||
    pathname === "/manifest.json"
  ) {
    const res = NextResponse.next();
    if (hasStaleCookies && pathname.startsWith("/setup")) {
      clearAuthCookies(res);
    }
    return res;
  }

  if (pathname.startsWith("/api/")) {
    if (!authenticated) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login")) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const res = NextResponse.next();
    if (hasStaleCookies) clearAuthCookies(res);
    return res;
  }

  if (!authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/setup";
    url.search = "";
    const res = NextResponse.redirect(url);
    if (hasStaleCookies) clearAuthCookies(res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|ico|webp)$).*)",
  ],
};
