import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { COOKIE_NAME } from "@/lib/auth/session";
import { verifySessionToken } from "@/lib/auth/jwt";

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/health",
]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    // 1. CSRF Origin Protection for state-changing API requests
    if (MUTATING_METHODS.has(request.method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json(
              { error: "Permintaan ditolak (CSRF Origin Mismatch)." },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: "Header Origin tidak valid." },
            { status: 403 }
          );
        }
      }
    }

    // 2. Enforce JWT Session Authentication on all non-public API routes
    if (!PUBLIC_API_PATHS.has(pathname)) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (!token) {
        return NextResponse.json(
          { error: "Tidak terautentikasi. Silakan masuk terlebih dahulu." },
          { status: 401 }
        );
      }

      const payload = await verifySessionToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: "Sesi tidak valid atau telah berakhir. Silakan masuk kembali." },
          { status: 401 }
        );
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
