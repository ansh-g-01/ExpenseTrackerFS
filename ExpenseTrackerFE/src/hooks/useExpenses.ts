import { useContext } from "react";
import { ExpenseContext } from "../context/expenseContext";

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used inside <ExpenseProvider>");
  return ctx;
}
