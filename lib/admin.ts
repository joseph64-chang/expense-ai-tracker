// 判斷這個 email 是不是站方指定的管理者信箱（見 .env.local 的 ADMIN_EMAIL，可用逗號分隔多個）。
// 註冊時用來決定初始角色，登入時用來自動把既有帳號升級成 admin。
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAIL;
  if (!adminEmails) return false;

  const target = email.trim().toLowerCase();
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}
