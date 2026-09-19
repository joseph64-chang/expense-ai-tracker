// 記帳分類的固定清單。同時給 OpenAI 的 JSON Schema 當作 enum 選項，
// 也給前端顯示用，集中寫在這裡兩邊才不會兜不起來。
export const EXPENSE_CATEGORIES = [
  "餐飲",
  "交通",
  "購物",
  "娛樂",
  "居住",
  "醫療",
  "教育",
  "其他",
] as const;

// 從陣列內容自動產生型別，例如 "餐飲" | "交通" | ...
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// 每個分類對應一個顏色，用在統計頁的長條圖和列表上的色點
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  餐飲: "#f97316",
  交通: "#3b82f6",
  購物: "#ec4899",
  娛樂: "#a855f7",
  居住: "#14b8a6",
  醫療: "#ef4444",
  教育: "#6366f1",
  其他: "#6b7280",
};
