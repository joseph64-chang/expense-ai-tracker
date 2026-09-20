"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// 兩個分頁：首頁「記帳」跟「統計」，icon 直接用 inline SVG，不用另外裝圖示套件
const TABS = [
  {
    href: "/",
    label: "記帳",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          strokeLinejoin="round"
        />
        <path d="M12 12v9M12 12L4.5 7.5M12 12l7.5-4.5" stroke="currentColor" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    href: "/stats",
    label: "統計",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M4 20V10M12 20V4M20 20v-7"
          stroke="currentColor"
          strokeWidth={active ? 2.5 : 1.5}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

// 後台管理的分頁，只有 admin 才會看到（見下方 isAdmin 判斷）
const ADMIN_TAB = {
  href: "/admin",
  label: "後台",
  icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth={active ? 1.6 : 1.2}
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function BottomNav() {
  // usePathname 讓我們知道目前在哪一頁，藉此把對應的 tab 反白
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  // 查一次目前登入者的角色，決定要不要多顯示「後台」分頁
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.user?.role === "admin"));
  }, []);

  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    // 浮動膠囊式導覽列：離畫面底部有一點距離，比貼齊邊緣的長條看起來更精緻。
    // bottom-4 是手機上的距離；sm:bottom-10 是因為桌機預覽時外框本身有 sm:my-6 的邊界，
    // 要把這段距離也算進去，導覽列才會貼齊「手機外框」而不是貼齊整個瀏覽器視窗底部。
    <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-2rem)] max-w-md sm:bottom-10">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-lg shadow-black/10 backdrop-blur">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent-soft text-accent" : "text-muted"
              }`}
            >
              {tab.icon(active)}
              {tab.label}
            </Link>
          );
        })}
      </div>
      {/* iPhone 底部 Home Indicator 的安全區域，留一段透明空間避免被系統手勢列蓋住 */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
