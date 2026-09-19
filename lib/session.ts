import { SignJWT, jwtVerify } from "jose";

// 登入狀態存在這個 cookie 裡，httpOnly + 簽章過的 JWT，前端 JS 讀不到也改不了
export const SESSION_COOKIE_NAME = "session";
// 對應下面 JWT 的過期時間，兩邊要一致，登入狀態才會跟 cookie 同時失效
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 天

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

// 用 AUTH_SECRET 當作簽章金鑰，任何人沒有這把金鑰就無法偽造合法的登入憑證
function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

// 登入/註冊成功後呼叫，產生要放進 cookie 的 JWT 字串
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

// 驗證 cookie 裡的 token 是否合法、沒過期，合法就回傳裡面存的使用者資訊
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    // 簽章不對、過期、或格式錯誤都會丟例外，這裡統一當作「沒有登入」處理
    return null;
  }
}
