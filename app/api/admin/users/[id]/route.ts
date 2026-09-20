import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import { getCurrentUser } from "@/lib/currentUser";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// PATCH /api/admin/users/:id  body: { role: "user" | "admin" }
// 調整某個使用者的角色
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const role = body?.role;

  if (role !== "user" && role !== "admin") {
    return NextResponse.json({ error: "role 必須是 user 或 admin" }, { status: 400 });
  }

  await connectToDatabase();
  const target = await UserModel.findById(id).catch(() => null);
  if (!target) {
    return NextResponse.json({ error: "找不到這個使用者" }, { status: 404 });
  }

  // 站方指定的管理者信箱（見 ADMIN_EMAIL）不能被降級：
  // 就算改成功，下次這個帳號登入時也會被自動升級回 admin，不如直接擋掉避免混淆
  if (isAdminEmail(target.email) && role !== "admin") {
    return NextResponse.json({ error: "這個帳號是預設管理者，無法降級" }, { status: 400 });
  }

  target.role = role;
  await target.save();

  return NextResponse.json({
    user: { id: target._id.toString(), email: target.email, name: target.name, role: target.role },
  });
}

// DELETE /api/admin/users/:id
// 刪除使用者帳號（不會連動刪除他過去記過的帳，那些紀錄會保留 userName 快照）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.userId) {
    return NextResponse.json({ error: "不能刪除自己的帳號" }, { status: 400 });
  }

  await connectToDatabase();
  const target = await UserModel.findById(id).catch(() => null);
  if (!target) {
    return NextResponse.json({ error: "找不到這個使用者" }, { status: 404 });
  }

  if (isAdminEmail(target.email)) {
    return NextResponse.json({ error: "這個帳號是預設管理者，無法刪除" }, { status: 400 });
  }

  await target.deleteOne();

  return NextResponse.json({ ok: true });
}
