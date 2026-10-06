import { createContext } from "react";
import type { Category, Expense, NewExpense } from "../types/expense";

export interface ExpenseContextValue {
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError?: string;
  /** Bumped after every change, so lists and charts know to refetch. */
  version: number;
  /** Each mutation throws an ApiError whose message can be shown to the user. */
  addExpense: (expense: NewExpense) => Promise<Expense>;
  addCategory: (name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export const ExpenseContext = createContext<ExpenseContextValue | null>(null);
