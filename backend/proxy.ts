import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, hashPassword, safeEqual } from "./lib/admin-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page itself must be reachable without a cookie.
  if (pathname === "/admin/login") return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse(
      "Admin disabled — ADMIN_PASSWORD env var is not set.",
      { status: 503 }
    );
  }

  const cookie = request.cookies.get(ADMIN_COOKIE)?.value ?? "";
  const expected = await hashPassword(password);

  if (!safeEqual(cookie, expected)) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
