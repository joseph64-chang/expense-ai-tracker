// 把 Date 轉成 "YYYY-MM-DD" 字串，注意這裡用的是「本地時間」的年月日
// (getFullYear/getMonth/getDate)，而不是 toISOString()（那個會先轉成 UTC）。
// 原因：伺服器若在 UTC+8（例如台灣）午夜前後執行，toISOString() 可能會
// 算出「昨天」的日期，造成記帳日期跟使用者認知的今天對不起來。
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0"); // 月份補 0 成兩位數
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 取得 "YYYY-MM"，用在月份統計查詢
export function toMonthKey(date: Date): string {
  return toDateKey(date).slice(0, 7);
}

// 取得 "YYYY"，用在年度統計查詢
export function toYearKey(date: Date): string {
  return toDateKey(date).slice(0, 4);
}

// 把 "YYYY-MM-DD" 往前/往後移動 delta 天，回傳新的 "YYYY-MM-DD"
// 用 Date 物件計算才能正確處理跨月/跨年（例如 1/1 的前一天是去年 12/31）
export function addDays(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}
