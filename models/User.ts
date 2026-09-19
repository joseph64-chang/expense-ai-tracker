import mongoose, { Schema, type InferSchemaType } from "mongoose";

// 使用者帳號的資料庫結構
const UserSchema = new Schema(
  {
    // unique: true 讓資料庫層面就擋掉重複 email，lowercase/trim 避免大小寫或空白造成重複帳號
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // 密碼不會直接存明文，而是存 bcrypt 雜湊過的字串（見 lib/password.ts）
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    // 目前只有 user / admin 兩種角色，預設一般使用者
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;

export default mongoose.models.User ?? mongoose.model("User", UserSchema);
