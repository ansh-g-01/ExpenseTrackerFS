import { createContext } from "react";
import type { Expense } from "../types/expense";

export interface ExpenseContextValue {
  expenses: Expense[];
  categories: string[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  /** Returns an error message, or null when the category was added. */
  addCategory: (name: string) => string | null;
  /** Returns an error message, or null when the category was deleted. */
  deleteCategory: (name: string) => string | null;
}

export const ExpenseContext = createContext<ExpenseContextValue | null>(null);
