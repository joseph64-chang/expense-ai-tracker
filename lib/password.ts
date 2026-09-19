import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// 把使用者輸入的明文密碼雜湊後才存進資料庫，資料庫外洩也不會直接洩漏密碼
export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// 登入時把使用者輸入的密碼跟資料庫裡的雜湊值比對，回傳是否相符
export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
