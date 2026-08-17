import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  if (process.env.APP_DEMO_MODE === "true") return NextResponse.next();
  const pathname = request.nextUrl.pathname;
  const cookieName = process.env.SESSION_COOKIE_NAME ?? "neoadmin_session";
  const hasSessionCookie = Boolean(request.cookies.get(cookieName)?.value);
  if (!hasSessionCookie && !PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
