"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthHero from "@/components/AuthHero";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "註冊失敗");
      }

      // 註冊 API 已經順便幫我們登入（設好 cookie），直接導回首頁即可
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AuthHero subtitle="家人／朋友共用的記帳本，需要邀請碼才能加入" />

      <div className="-mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-card px-6 pb-10 pt-8 shadow-[0_-12px_30px_-15px_rgba(0,0,0,0.15)]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字"
            required
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密碼（至少 6 個字元）"
            required
            minLength={6}
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
          />
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="邀請碼"
            required
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
          />

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition-opacity disabled:opacity-50"
          >
            {submitting ? "註冊中…" : "註冊並登入"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          已經有帳號了？{" "}
          <Link href="/login" className="font-semibold text-accent">
            去登入
          </Link>
        </p>
      </div>
    </div>
  );
}
