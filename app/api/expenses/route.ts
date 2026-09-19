import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseModel from "@/models/Expense";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { toDateKey } from "@/lib/date";
import { getCurrentUser } from "@/lib/currentUser";

// 單一筆記帳資料要求 OpenAI 回傳的 JSON 結構
const recordSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["expense", "income"] },
    amount: { type: "number" },
    currency: { type: "string" },
    category: { type: "string", enum: EXPENSE_CATEGORIES },
    description: { type: "string" },
    date: { type: "string", description: "ISO 8601 date, e.g. 2026-09-17" },
  },
  required: ["type", "amount", "currency", "category", "description", "date"],
  additionalProperties: false,
};

// 整體回傳格式是一個 records 陣列，因為使用者一句話可能包含好幾筆交易
// （例如「早餐50、午餐120」），如果只設計成單筆物件，AI 就只能選一筆回傳。
const responseSchema = {
  type: "object",
  properties: {
    records: { type: "array", items: recordSchema },
  },
  required: ["records"],
  additionalProperties: false,
};

type ParsedRecord = {
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
};

// GET /api/expenses?date=YYYY-MM-DD
// 給前端「日期滑動列」使用：查詢某一天所有的記帳紀錄
export async function GET(request: Request) {
  // proxy.ts 已經擋過沒登入的請求，這裡再檢查一次純粹是防呆（沒登入就不該進得來）
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date query param is required" }, { status: 400 });
  }

  await connectToDatabase();

  // 這是多人共用的記帳本，這裡「不」用 userId 篩選——不管是誰記的都要顯示出來，
  // 每筆資料裡的 userName 欄位讓前端可以標示「這筆是誰記的」
  const expenses = await ExpenseModel.find({ dateKey: date }).sort({ createdAt: 1 });

  return NextResponse.json({ expenses });
}

// POST /api/expenses
// 接收使用者輸入的自然語言文字，丟給 OpenAI 解析成結構化資料後存進資料庫
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // 讓 AI 知道「今天」是幾號，這樣使用者沒講日期時，AI 才能補上正確的日期
  const today = toDateKey(new Date());

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `你是一個記帳助手，負責把使用者輸入的自然語言記帳描述，轉換成結構化的記帳資料。一段文字裡可能包含多筆交易，請把每一筆都拆開列在 records 陣列中，不要遺漏或合併。今天的日期是 ${today}，若使用者沒有提到日期，就使用今天的日期。金額一律轉換成數字，幣別預設為 TWD。category 必須從以下選項中選一個：${EXPENSE_CATEGORIES.join("、")}。`,
      },
      { role: "user", content: text },
    ],
    // response_format 強制 AI 依照上面定義的 JSON Schema 回答，
    // 這樣拿到的一定是合法 JSON，不用自己再寫一堆字串解析的容錯邏輯
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "expense_records",
        schema: responseSchema,
        strict: true,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
  }

  const parsed = JSON.parse(raw) as { records: ParsedRecord[] };

  if (parsed.records.length === 0) {
    return NextResponse.json({ error: "無法從輸入中解析出任何記錄" }, { status: 422 });
  }

  await connectToDatabase();

  // 一次把所有解析出來的紀錄存進 MongoDB（insertMany 比一筆一筆 create 快）
  const saved = await ExpenseModel.insertMany(
    parsed.records.map((record) => ({
      userId: user.userId,
      userName: user.name,
      rawText: text,
      type: record.type,
      amount: record.amount,
      currency: record.currency,
      category: record.category,
      description: record.description,
      date: new Date(record.date),
      dateKey: record.date, // AI 回傳的 date 已經是 "YYYY-MM-DD"，直接拿來當 dateKey
    }))
  );

  return NextResponse.json({ expenses: saved });
}
