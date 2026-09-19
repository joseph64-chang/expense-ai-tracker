"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import DateStrip from "@/components/DateStrip";
import { toDateKey } from "@/lib/date";
import { CATEGORY_COLORS } from "@/lib/categories";

type Expense = {
  _id: string;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  dateKey: string;
  userName: string; // 這是共用記帳本，每筆都標記是誰記的
};

export default function Home() {
  const router = useRouter();

  // 目前登入的使用者，用來在頂部顯示「哈囉，OOO」
  const [userName, setUserName] = useState<string | null>(null);

  // 預設選中的日期是「今天」，之後可以透過 DateStrip 左右滑動切換
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 進頁面時查一次「我是誰」，用來顯示歡迎訊息
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUserName(data.user?.name ?? null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // 只要 selectedDate 改變（第一次進頁面，或使用者滑動選了別的日期），
  // 就重新跟後端要那一天的記帳清單
  useEffect(() => {
    let cancelled = false; // 避免使用者快速切換日期時，舊的請求晚回來蓋掉新的結果

    setListLoading(true);
    fetch(`/api/expenses?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setExpenses(data.expenses ?? []);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "分析失敗");
      }

      setText("");
      const newExpenses: Expense[] = data.expenses;
      const firstDateKey = newExpenses[0]?.dateKey;

      if (firstDateKey === selectedDate) {
        // 新增的紀錄剛好就是目前正在看的這一天 -> 直接把新資料加進畫面
        setExpenses((prev) => [...prev, ...newExpenses]);
      } else if (firstDateKey) {
        // AI 判斷這筆紀錄屬於別的日期（例如「昨天」）-> 自動切換過去看
        setSelectedDate(firstDateKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setSubmitting(false);
    }
  }

  // 分開加總「支出小計」跟「收入小計」，比顯示單一淨額更容易一眼看懂
  const expenseTotal = expenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = expenses
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col">
      {/* sticky top-0：往下捲動看清單時，標題／日期列／輸入框固定在畫面上方 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 pt-5">
          <div>
            <h1 className="text-xl font-bold">Meng的AI家庭記帳本</h1>
            {userName && <p className="text-xs text-muted">哈囉，{userName}</p>}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-muted underline underline-offset-2"
          >
            登出
          </button>
        </div>

        <DateStrip selected={selectedDate} onSelect={setSelectedDate} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 pb-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例如：午餐吃牛肉麵 150 元"
            rows={2}
            required
            className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-md shadow-accent/25 transition-opacity disabled:opacity-50"
          >
            {submitting ? "分析中…" : "新增紀錄"}
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      </div>

      {/* 當天的支出／收入小計 */}
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-muted">{selectedDate}</span>
        <span className="flex gap-3">
          <span className="font-medium text-danger">支出 {expenseTotal}</span>
          {incomeTotal > 0 && <span className="font-medium text-success">收入 {incomeTotal}</span>}
        </span>
      </div>

      {/* 交易清單：載入中 / 空狀態 / 正常列表 三種畫面 */}
      <div className="flex flex-col gap-2 px-4 pb-6">
        {listLoading && <p className="py-8 text-center text-sm text-muted">載入中…</p>}

        {!listLoading && expenses.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">這天還沒有記帳紀錄</p>
        )}

        {expenses.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm shadow-black/[.03]"
          >
            {/* 分類色點：外面一圈淡色暈染，顏色對應 lib/categories.ts 裡的 CATEGORY_COLORS */}
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "#6b7280"}1a`,
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "#6b7280",
                }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.description}</p>
              {/* 共用記帳本：標示這筆是誰記的 */}
              <p className="text-xs text-muted">
                {item.category} ・ {item.userName}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-semibold ${
                item.type === "expense" ? "text-danger" : "text-success"
              }`}
            >
              {item.type === "expense" ? "-" : "+"}
              {item.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
