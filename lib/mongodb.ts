import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Next.js 在開發模式下每次程式碼變動都會重新載入模組，如果沒有快取連線，
// 每次請求（或每次熱重載）都會重新開一條 MongoDB 連線，很快就會把連線數用光。
// 這裡把連線快取塞進 globalThis，讓它在熱重載之間存活下來。
const globalForMongoose = globalThis as unknown as { mongoose?: MongooseCache };

const cache: MongooseCache = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cache;

export async function connectToDatabase() {
  // 已經連線過，直接重複使用
  if (cache.conn) {
    return cache.conn;
  }

  // 還沒有連線中的 promise，才發起新的連線請求（避免同時多次呼叫時重複連線）
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI as string);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
