"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function BottomNav() {
  // usePathname 讓我們知道目前在哪一頁，藉此把對應的 tab 反白
  const pathname = usePathname();

  return (
    // 浮動膠囊式導覽列：離畫面底部有一點距離，比貼齊邊緣的長條看起來更精緻。
    // bottom-4 是手機上的距離；sm:bottom-10 是因為桌機預覽時外框本身有 sm:my-6 的邊界，
    // 要把這段距離也算進去，導覽列才會貼齊「手機外框」而不是貼齊整個瀏覽器視窗底部。
    <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-2rem)] max-w-md sm:bottom-10">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-lg shadow-black/10 backdrop-blur">
        {TABS.map((tab) => {
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
