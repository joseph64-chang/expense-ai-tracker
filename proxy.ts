import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Next.js 16 把 middleware.ts 改名成 proxy.ts（功能完全一樣，只是檔名/函式名不同）。
// 這支程式會在指定的路徑「進到頁面/API 之前」先執行，用來擋住沒登入的請求。
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    // 已經登入的人不需要再看到登入/註冊頁，直接導回首頁
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    // API 請求回 401 JSON（前端 fetch 好處理），一般頁面則導去登入頁
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 後台管理路徑只有 admin 能進，一般使用者當作沒有這個地方
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminPath && session.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// 只在這些路徑上執行，避免每個靜態資源請求都白白驗證一次 cookie
export const config = {
  matcher: [
    "/",
    "/stats",
    "/login",
    "/register",
    "/admin/:path*",
    "/api/expenses/:path*",
    "/api/admin/:path*",
  ],
};
