import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meng的AI家庭記帳本",
  description: "用一句話記帳，AI 自動幫你分類",
};

// themeColor 會影響手機瀏覽器網址列/狀態列的顏色，讓網頁看起來更像原生 App
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#131318" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*
        外層 body 用比手機畫面更深一點的底色（桌機瀏覽時）：
        這樣中間的「手機外框」會因為陰影/對比而立體浮起來，質感更像真的裝置。
      */}
      <body className="min-h-full bg-zinc-200 dark:bg-black">
        {/*
          AppShell 負責手機外框（mx-auto + max-w-md + min-h-dvh）跟底部 Tab Bar，
          並且會依照目前網址決定登入/註冊頁要不要顯示 Tab Bar。
        */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
