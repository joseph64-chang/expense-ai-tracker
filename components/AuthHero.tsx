// 登入／註冊頁共用的品牌區塊：漸層底色 + App 圖示 + 標題，
// 讓這兩頁看起來像正式的產品「歡迎畫面」，而不是一個孤零零的表單。
export default function AuthHero({ subtitle }: { subtitle: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-accent to-[#4536c9] px-6 pb-16 pt-20 text-center">
      {/* 兩顆模糊光暈裝飾：讓純色漸層背景多一點層次感，不會顯得太平面 */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-lg backdrop-blur">
        💰
      </div>
      <h1 className="relative mt-4 text-2xl font-bold text-white">Meng的AI家庭記帳本</h1>
      <p className="relative mt-1.5 text-sm text-white/80">{subtitle}</p>
    </div>
  );
}
