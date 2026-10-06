import type { Expense } from "../types/expense";
import { MONTH_LABELS } from "./date";

export interface ChartPoint {
  label: string;
  total: number;
}

/** `month` is YYYY-MM. One point per day of that month. */
export function dailyTotals(expenses: Expense[], month: string): ChartPoint[] {
  if (!month) return [];
  const [y, m] = month.split("-").map(Number);
  const totals: number[] = Array(new Date(y, m, 0).getDate()).fill(0);
  for (const e of expenses) {
    if (e.date.startsWith(month)) totals[Number(e.date.slice(8, 10)) - 1] += e.amount;
  }
  return totals.map((total, i) => ({ label: String(i + 1), total }));
}

/** `year` is YYYY. One point per month. */
export function monthlyTotals(expenses: Expense[], year: string): ChartPoint[] {
  const totals: number[] = Array(12).fill(0);
  for (const e of expenses) {
    if (e.date.startsWith(`${year}-`)) totals[Number(e.date.slice(5, 7)) - 1] += e.amount;
  }
  return totals.map((total, i) => ({ label: MONTH_LABELS[i], total }));
}

/** One point per year, from the earliest expense to the latest (or the current year). */
export function yearlyTotals(expenses: Expense[]): ChartPoint[] {
  const years = expenses.map((e) => Number(e.date.slice(0, 4)));
  const thisYear = new Date().getFullYear();
  const min = Math.min(thisYear, ...years);
  const max = Math.max(thisYear, ...years);
  const points: ChartPoint[] = [];
  for (let y = min; y <= max; y++) {
    const total = expenses
      .filter((e) => e.date.startsWith(`${y}-`))
      .reduce((sum, e) => sum + e.amount, 0);
    points.push({ label: String(y), total });
  }
  return points;
}

export function categoryTotals(expenses: Expense[]): ChartPoint[] {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}
