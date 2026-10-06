import type { Category, Expense, Prisma } from "@prisma/client";
import { fromDbDate } from "./dates.js";

export const toNumber = (value: Prisma.Decimal | number | bigint | null | undefined) => (value == null ? 0 : Number(value));

export const serializeCategory = (c: Pick<Category, "id" | "name">, expenseCount: number) => ({
  id: c.id,
  name: c.name,
  expenseCount,
});

export const serializeExpense = (e: Expense & { category: Pick<Category, "name"> }) => ({
  id: e.id,
  name: e.name,
  amount: toNumber(e.amount),
  categoryId: e.categoryId,
  categoryName: e.category.name,
  date: fromDbDate(e.date),
  createdAt: e.createdAt.toISOString(),
});
