import OpenAI from "openai";

// .env.local 裡的變數名稱是 OPEN_AI_API_KEY（注意跟常見的 OPENAI_API_KEY 拼法不同）
const apiKey = process.env.OPEN_AI_API_KEY;

if (!apiKey) {
  // 少了金鑰就直接讓應用程式在啟動時失敗，比讓每個 API 呼叫悄悄失敗更容易除錯
  throw new Error("Missing OPEN_AI_API_KEY environment variable");
}

// 建立一個共用的 OpenAI client，供各個 API route 匯入使用
export const openai = new OpenAI({ apiKey });
