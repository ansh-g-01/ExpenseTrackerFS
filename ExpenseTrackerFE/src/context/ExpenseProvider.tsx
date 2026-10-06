import { useState } from "react";
import type { ReactNode } from "react";
import { ExpenseContext } from "./expenseContext";
import { api } from "../api/client";
import { useApiGet } from "../hooks/useApiGet";
import type { Category, Expense, NewExpense } from "../types/expense";

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const categories = useApiGet<Category[]>("/categories", version);
  const invalidate = () => setVersion((v) => v + 1);

  const addExpense = async (expense: NewExpense) => {
    const created = await api.post<Expense>("/expenses", expense);
    invalidate(); // category counts change too
    return created;
  };

  const addCategory = async (name: string) => {
    const created = await api.post<Category>("/categories", { name });
    invalidate();
    return created;
  };

  const deleteCategory = async (id: string) => {
    await api.delete(`/categories/${encodeURIComponent(id)}`);
    invalidate();
  };

  return (
    <ExpenseContext.Provider
      value={{
        categories: categories.data ?? [],
        categoriesLoading: categories.loading && !categories.data,
        categoriesError: categories.error,
        version,
        addExpense,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}
