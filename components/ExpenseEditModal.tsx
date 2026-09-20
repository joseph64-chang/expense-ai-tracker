"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export type EditableExpense = {
  _id: string;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  description: string;
  dateKey: string;
};

type Props = {
  expense: EditableExpense;
  onClose: () => void;
  onSaved: (expense: EditableExpense) => void;
  onDeleted: (id: string) => void;
};

export default function ExpenseEditModal({ expense, onClose, onSaved, onDeleted }: Props) {
  const [type, setType] = useState<"expense" | "income">(expense.type);
  const [amount, setAmount] = useState(String(expense.amount));
  const [currency, setCurrency] = useState(expense.currency);
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.dateKey);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: Number(amount), currency, category, description, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      onSaved(data.expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("確定要刪除這筆紀錄嗎？此動作無法復原。")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "刪除失敗");
      onDeleted(expense._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      {/* 半透明背景，點擊可以直接關閉 modal */}
      <button type="button" aria-label="關閉" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-md rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">編輯紀錄</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            關閉
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex rounded-full border border-border bg-background p-1 text-sm">
            {(["expense", "income"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`flex-1 rounded-full py-1.5 font-medium transition-colors ${
                  type === option ? "bg-accent text-accent-foreground shadow-sm" : "text-muted"
                }`}
              >
                {option === "expense" ? "支出" : "收入"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="金額"
              className="w-2/3 rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="幣別"
              className="w-1/3 rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="說明"
            className="rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
          />

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="h-11 flex-1 rounded-full border border-danger/30 text-sm font-semibold text-danger disabled:opacity-50"
            >
              {deleting ? "刪除中…" : "刪除"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || deleting}
              className="h-11 flex-1 rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-md shadow-accent/25 disabled:opacity-50"
            >
              {saving ? "儲存中…" : "儲存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
