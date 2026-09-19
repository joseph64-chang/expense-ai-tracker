import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel, { type Expense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/currentUser";

// 把一堆記帳紀錄彙總成「總支出／總收入／各分類小計＋佔比」，
// 月統計和年統計都需要同一套彙總邏輯，所以抽成共用函式避免重複程式碼
function summarize(items: Expense[]) {
  const totals = { expense: 0, income: 0 };
  const categoryTotals = new Map<string, number>();

  for (const item of items) {
    if (item.type === "expense") {
      totals.expense += item.amount;
      categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + item.amount);
    } else {
      totals.income += item.amount;
    }
  }

  const categories = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totals.expense > 0 ? Math.round((amount / totals.expense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { totalExpense: totals.expense, totalIncome: totals.income, categories };
}

// GET /api/expenses/stats?month=YYYY-MM  → 單月統計
// GET /api/expenses/stats?year=YYYY      → 整年統計（含每個月的支出小計，方便畫月份長條圖）
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  await connectToDatabase();

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month query param must be YYYY-MM" }, { status: 400 });
    }

    // dateKey 格式固定是 "YYYY-MM-DD"，用 "^2026-09" 這種開頭比對
    // 就能抓出整個月份的資料，比對日期範圍的寫法簡單很多。
    // 共用記帳本：統計是全部人的加總，不用 userId 篩選
    const monthExpenses = await ExpenseModel.find({ dateKey: { $regex: `^${month}` } });

    return NextResponse.json({ scope: "month", month, ...summarize(monthExpenses) });
  }

  if (year) {
    if (!/^\d{4}$/.test(year)) {
      return NextResponse.json({ error: "year query param must be YYYY" }, { status: 400 });
    }

    const yearExpenses = await ExpenseModel.find({ dateKey: { $regex: `^${year}-` } });
    const { totalExpense, totalIncome, categories } = summarize(yearExpenses);

    // 額外算出「每個月的支出小計」，前端可以畫成 1~12 月的長條圖
    const monthlyExpense = new Map<string, number>();
    for (const item of yearExpenses) {
      if (item.type !== "expense") continue;
      const monthNumber = item.dateKey.slice(5, 7); // "2026-03-05" -> "03"
      monthlyExpense.set(monthNumber, (monthlyExpense.get(monthNumber) ?? 0) + item.amount);
    }

    const months = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = String(index + 1).padStart(2, "0");
      return {
        month: `${year}-${monthNumber}`,
        amount: monthlyExpense.get(monthNumber) ?? 0,
      };
    });

    return NextResponse.json({ scope: "year", year, totalExpense, totalIncome, categories, months });
  }

  return NextResponse.json({ error: "month or year query param is required" }, { status: 400 });
}
