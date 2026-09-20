"use client";

import { useEffect, useState } from "react";

type Role = "user" | "admin";

type AdminUser = {
  _id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export default function AdminPage() {
  const [meId, setMeId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 記錄哪一筆正在處理中，避免同一個使用者被重複點擊
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setMeId(data.user?.userId ?? null));
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }

  async function handleRoleChange(id: string, role: Role) {
    setPendingId(id);
    setError(null);
    const prevUsers = users;
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
    } catch (err) {
      setUsers(prevUsers); // 失敗就把畫面改回原本的角色
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`確定要刪除「${email}」這個帳號嗎？此動作無法復原。`)) return;

    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "刪除失敗");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <div>
        <h1 className="text-xl font-bold">後台管理</h1>
        <p className="text-xs text-muted">共 {users.length} 位使用者</p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {loading && <p className="py-8 text-center text-sm text-muted">載入中…</p>}

      {!loading && (
        <div className="flex flex-col gap-2 pb-6">
          {users.map((u) => {
            const isSelf = u._id === meId;
            const isPending = pendingId === u._id;

            return (
              <div
                key={u._id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm shadow-black/[.03]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.name}
                    {isSelf && <span className="ml-1 text-xs text-muted">（我）</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>

                <select
                  value={u.role}
                  disabled={isPending}
                  onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                  className="shrink-0 rounded-full border border-border bg-background px-2 py-1 text-xs outline-none disabled:opacity-50"
                >
                  <option value="user">一般使用者</option>
                  <option value="admin">管理者</option>
                </select>

                <button
                  type="button"
                  disabled={isPending || isSelf}
                  onClick={() => handleDelete(u._id, u.email)}
                  className="shrink-0 text-xs text-danger underline underline-offset-2 disabled:opacity-40"
                >
                  刪除
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
