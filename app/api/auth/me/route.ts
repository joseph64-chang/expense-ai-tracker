import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/auth/me：前端用來查詢「目前是誰登入」，沒登入回傳 user: null
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
