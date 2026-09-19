"use client";

import { useEffect, useMemo, useState } from "react";
import { toMonthKey, toYearKey } from "@/lib/date";
import { CATEGORY_COLORS } from "@/lib/categories";

type CategoryStat = {
  category: string;
  amount: number;
  percentage: number;
};

type MonthStatsResponse = {
  scope: "month";
  month: string;
  totalExpense: number;
  totalIncome: number;
  categories: CategoryStat[];
};

type YearStatsResponse = {
  scope: "year";
  year: string;
  totalExpense: number;
  totalIncome: number;
  categories: CategoryStat[];
  months: { month: string; amount: number }[];
};

// "月" 或 "年"：切換統計要看單一月份，還是整年的總覽
type Scope = "month" | "year";

// "2026-09" 位移 delta 個月，例如 delta=1 變成 "2026-10"，delta=-1 變成 "2026-08"
// 用 Date 物件計算才能正確處理跨年（12 月的下一個月是隔年 1 月）
function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return toMonthKey(d);
}

function shiftYear(yearKey: string, delta: number): string {
  return String(Number(yearKey) + delta);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year} 年 ${month} 月`;
}

// 分類長條圖：月統計、年統計都會用到同一種畫法，抽成共用元件
function CategoryBars({ categories }: { categories: CategoryStat[] }) {
  if (categories.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">這段期間還沒有支出紀錄</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((item) => (
        <div key={item.category} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.category}</span>
            <span className="text-muted">
              {item.amount} TWD ・ {item.percentage}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.percentage}%`,
                backgroundColor:
                  CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "#6b7280",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const [scope, setScope] = useState<Scope>("month");
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [year, setYear] = useState(() => toYearKey(new Date()));

  const [monthStats, setMonthStats] = useState<MonthStatsResponse | null>(null);
  const [yearStats, setYearStats] = useState<YearStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 月份一改變就重新跟後端要那個月的統計資料（只在 scope 是 "month" 時才需要抓）
  useEffect(() => {
    if (scope !== "month") return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/expenses/stats?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMonthStats(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scope, month]);

  // 年份一改變就重新跟後端要整年的統計資料（只在 scope 是 "year" 時才需要抓）
  useEffect(() => {
    if (scope !== "year") return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/expenses/stats?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setYearStats(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scope, year]);

  // 月份長條圖的高度需要一個「最大值」當基準，用當年 12 個月裡花費最高的那個月來換算比例
  const maxMonthlyAmount = useMemo(() => {
    if (!yearStats) return 0;
    return Math.max(1, ...yearStats.months.map((m) => m.amount));
  }, [yearStats]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <h1 className="text-xl font-bold">統計</h1>

      {/* 月／年 切換：用一個雙按鈕的分段控制項（segmented control）樣式 */}
      <div className="flex rounded-full border border-border bg-card p-1 text-sm">
        {(["month", "year"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setScope(option)}
            className={`flex-1 rounded-full py-1.5 font-medium transition-colors ${
              scope === option ? "bg-accent text-accent-foreground shadow-sm" : "text-muted"
            }`}
          >
            {option === "month" ? "月統計" : "年統計"}
          </button>
        ))}
      </div>

      {scope === "month" ? (
        <>
          {/* 月份切換：左右箭頭各自把 month 往前/往後移一個月 */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-2">
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted"
              aria-label="上個月"
            >
              ‹
            </button>
            <span className="text-sm font-semibold">{formatMonthLabel(month)}</span>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted"
              aria-label="下個月"
            >
              ›
            </button>
          </div>

          {loading && <p className="py-8 text-center text-sm text-muted">載入中…</p>}

          {!loading && monthStats && (
            <>
              <div className="rounded-3xl border border-border bg-card p-4 shadow-sm shadow-black/[.03]">
                <p className="text-xs text-muted">本月支出</p>
                <p className="text-2xl font-bold text-danger">{monthStats.totalExpense} TWD</p>
                {monthStats.totalIncome > 0 && (
                  <p className="mt-1 text-xs text-success">本月收入 {monthStats.totalIncome} TWD</p>
                )}
              </div>

              <CategoryBars categories={monthStats.categories} />
            </>
          )}
        </>
      ) : (
        <>
          {/* 年份切換：左右箭頭各自把 year 往前/往後移一年 */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-2">
            <button
              type="button"
              onClick={() => setYear((y) => shiftYear(y, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted"
              aria-label="上一年"
            >
              ‹
            </button>
            <span className="text-sm font-semibold">{year} 年</span>
            <button
              type="button"
              onClick={() => setYear((y) => shiftYear(y, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted"
              aria-label="下一年"
            >
              ›
            </button>
          </div>

          {loading && <p className="py-8 text-center text-sm text-muted">載入中…</p>}

          {!loading && yearStats && (
            <>
              <div className="rounded-3xl border border-border bg-card p-4 shadow-sm shadow-black/[.03]">
                <p className="text-xs text-muted">本年支出</p>
                <p className="text-2xl font-bold text-danger">{yearStats.totalExpense} TWD</p>
                {yearStats.totalIncome > 0 && (
                  <p className="mt-1 text-xs text-success">本年收入 {yearStats.totalIncome} TWD</p>
                )}
              </div>

              {/* 12 個月的長條圖：點一下某個月，可以直接切去看那個月的詳細分類 */}
              <div className="flex h-32 items-end gap-1.5 rounded-3xl border border-border bg-card p-4 shadow-sm shadow-black/[.03]">
                {yearStats.months.map((item) => {
                  const heightPercent = Math.max(4, (item.amount / maxMonthlyAmount) * 100);
                  const monthNumber = Number(item.month.slice(5, 7));
                  return (
                    <button
                      key={item.month}
                      type="button"
                      onClick={() => {
                        setMonth(item.month);
                        setScope("month");
                      }}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                      aria-label={`查看 ${item.month} 的統計`}
                    >
                      <div
                        className="w-full rounded-t-sm bg-accent transition-opacity hover:opacity-80"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-muted">{monthNumber}</span>
                    </button>
                  );
                })}
              </div>

              <CategoryBars categories={yearStats.categories} />
            </>
          )}
        </>
      )}
    </div>
  );
}
