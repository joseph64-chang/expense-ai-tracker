import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/admin/users：後台使用者列表
// proxy.ts 已經擋過非 admin 的請求，這裡再檢查一次純粹是防呆
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  // passwordHash 絕對不能回傳給前端，用 select 排除掉
  const users = await UserModel.find().select("-passwordHash").sort({ createdAt: 1 });

  return NextResponse.json({ users });
}
