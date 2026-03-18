import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/auth";

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /teacher routes (handles both localized and non-localized paths)
  const isTeacherRoute = pathname.match(/^\/(en|vi)\/teacher/) || pathname.startsWith("/teacher");
  if (isTeacherRoute) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      const locale = pathname.match(/^\/(en|vi)/)?.[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    try {
      const decoded = await decrypt(session);
      if (!decoded || decoded.role !== "TEACHER") {
        const locale = pathname.match(/^\/(en|vi)/)?.[1] || "en";
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }
    } catch (e) {
      const locale = pathname.match(/^\/(en|vi)/)?.[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // Route i18n
  return handleI18nRouting(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(vi|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
