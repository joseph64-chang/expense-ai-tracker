"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

// 登入／註冊頁不需要底部 Tab Bar，這裡統一決定哪些頁面要顯示手機 App 的殼
const PAGES_WITHOUT_NAV = ["/login", "/register"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = !PAGES_WITHOUT_NAV.includes(pathname);

  return (
    // sm:shadow-2xl + sm:my-6：桌機瀏覽時讓手機外框看起來像浮起來的裝置卡片，
    // 手機瀏覽（畫面本身就是 max-w-md 寬）時這些效果自然不會顯現，不影響真手機體驗
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-black/10">
      {/* 有 BottomNav 時才留底部空間，避免內容被擋住；登入頁沒有 nav 就不用留白 */}
      <div className={`flex-1 ${showNav ? "pb-24" : ""}`}>{children}</div>
      {showNav && <BottomNav />}
    </div>
  );
}
