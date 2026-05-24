import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthenticated(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get("session")?.value || req.cookies.get("userId")?.value,
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/health") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login")) {
    if (isAuthenticated(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|ico|webp)$).*)",
  ],
};
