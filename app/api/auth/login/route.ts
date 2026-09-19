import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

// POST /api/auth/login
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "email、password 都是必填" }, { status: 400 });
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ email });
  // 找不到帳號跟密碼錯誤回傳一樣的錯誤訊息，避免讓人用這個 API 探測哪些 email 已註冊
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "email 或密碼錯誤" }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
  });
}
