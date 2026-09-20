import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel from "@/models/Expense";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { getCurrentUser } from "@/lib/currentUser";

// PATCH /api/expenses/:id
// 修改一筆記帳紀錄。這是共用記帳本，proxy.ts 已擋過沒登入的請求，
// 任何登入者都能改任何人記的紀錄（跟首頁「大家都看得到全部紀錄」的設計一致）。
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const type = body?.type;
  const amount = body?.amount;
  const currency = typeof body?.currency === "string" ? body.currency.trim() : "";
  const category = body?.category;
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const date = typeof body?.date === "string" ? body.date : "";

  if (type !== "expense" && type !== "income") {
    return NextResponse.json({ error: "type 必須是 expense 或 income" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount 必須是大於 0 的數字" }, { status: 400 });
  }
  if (!currency) {
    return NextResponse.json({ error: "currency 為必填" }, { status: 400 });
  }
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "category 不在允許的分類清單中" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "description 為必填" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date 格式必須是 YYYY-MM-DD" }, { status: 400 });
  }

  await connectToDatabase();

  const expense = await ExpenseModel.findByIdAndUpdate(
    id,
    {
      type,
      amount,
      currency,
      category,
      description,
      date: new Date(date),
      dateKey: date, // 跟 POST /api/expenses 一樣，date 已經是 "YYYY-MM-DD" 就直接當 dateKey
    },
    { new: true }
  ).catch(() => null);

  if (!expense) {
    return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  }

  return NextResponse.json({ expense });
}

// DELETE /api/expenses/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectToDatabase();
  const expense = await ExpenseModel.findByIdAndDelete(id).catch(() => null);

  if (!expense) {
    return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
