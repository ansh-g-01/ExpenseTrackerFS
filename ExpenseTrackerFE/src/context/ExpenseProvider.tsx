import type { ReactNode } from "react";
import { ExpenseContext } from "./expenseContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { initialExpenses } from "../data/initialExpenses";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import type { Expense } from "../types/expense";

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses-demo-v2", initialExpenses);
  const [categories, setCategories] = useLocalStorage<string[]>("categories", DEFAULT_CATEGORIES);

  const addExpense = (expense: Omit<Expense, "id">) => {
    setExpenses([{ ...expense, id: crypto.randomUUID() }, ...expenses]);
  };

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required";
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return "Category already exists";
    }
    setCategories([...categories, trimmed]);
    return null;
  };

  const deleteCategory = (name: string) => {
    const inUse = expenses.filter((e) => e.category === name).length;
    if (inUse > 0) return `"${name}" is used by ${inUse} expense${inUse === 1 ? "" : "s"} and can't be deleted`;
    setCategories(categories.filter((c) => c !== name));
    return null;
  };

  return (
    <ExpenseContext.Provider value={{ expenses, categories, addExpense, addCategory, deleteCategory }}>
      {children}
    </ExpenseContext.Provider>
  );
}
