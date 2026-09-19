import mongoose, { Schema, type InferSchemaType } from "mongoose";

// 一筆記帳資料的資料庫結構（Mongoose Schema）
const ExpenseSchema = new Schema(
  {
    // 這是「多人共用」的記帳本：所有人都看得到全部紀錄，
    // 這兩個欄位只是用來標記「這筆是誰記的」，不會拿來篩選看不看得到。
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // 直接把記錄當下的名字存一份（不用每次都 join User 表），列表顯示很方便
    userName: { type: String, required: true },
    rawText: { type: String, required: true }, // 使用者原始輸入的那句話，保留備查
    type: { type: String, enum: ["expense", "income"], required: true }, // 支出或收入
    amount: { type: Number, required: true }, // 金額（數字）
    currency: { type: String, required: true, default: "TWD" }, // 幣別，預設台幣
    category: { type: String, required: true }, // AI 判斷出的分類，例如「餐飲」
    description: { type: String, required: true }, // AI 整理過的簡短說明
    date: { type: Date, required: true }, // 交易日期（Date 物件，方便排序）
    // dateKey 是 "YYYY-MM-DD" 字串版本的日期，用來查詢「某一天」或「某個月」
    // 的資料時可以直接用字串比對，不用處理時區換算的問題，index 讓查詢更快。
    dateKey: { type: String, required: true, index: true },
  },
  { timestamps: true } // 自動加上 createdAt / updatedAt 欄位
);

// 從 Schema 自動推導出 TypeScript 型別，之後程式碼可以用 Expense 這個型別
export type Expense = InferSchemaType<typeof ExpenseSchema>;

// Next.js 開發模式會重複載入模組，若重複呼叫 mongoose.model 會噴錯，
// 所以先檢查 mongoose.models 裡有沒有建立過，有就重複使用既有的 model。
export default mongoose.models.Expense ?? mongoose.model("Expense", ExpenseSchema);
