import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import { hashPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 這是私人共用記帳本，用一組寫死的邀請碼擋掉陌生人亂註冊。
// 之後要換碼或改成資料庫管理，只要改這裡即可。
const INVITE_CODE = "love";

// POST /api/auth/register
// 註冊帳號：驗證輸入 -> 檢查邀請碼 -> 檢查 email 是否已被註冊 -> 雜湊密碼存進資料庫 -> 直接幫使用者登入
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const inviteCode = typeof body?.inviteCode === "string" ? body.inviteCode.trim() : "";

  if (!email || !password || !name || !inviteCode) {
    return NextResponse.json({ error: "email、password、name、邀請碼都是必填" }, { status: 400 });
  }
  if (inviteCode !== INVITE_CODE) {
    return NextResponse.json({ error: "邀請碼錯誤" }, { status: 403 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "email 格式不正確" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密碼至少需要 6 個字元" }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "這個 email 已經被註冊過了" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({ email, passwordHash, name, role: "user" });

  // 註冊完直接視為登入：簽發 session token 並寫進 cookie
  const token = await createSessionToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // 前端 JavaScript 讀不到，降低被 XSS 偷走 token 的風險
    secure: process.env.NODE_ENV === "production", // 本機 http://localhost 開發時關閉，正式環境（https）才開啟
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
  });
}
