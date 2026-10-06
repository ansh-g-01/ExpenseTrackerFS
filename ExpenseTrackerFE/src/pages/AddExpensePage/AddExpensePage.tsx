import AddExpense from "../../components/AddExpense/AddExpense";
import ExpenseList from "../../components/ExpenseList/ExpenseList";
import { useExpenses } from "../../hooks/useExpenses";

export default function AddExpensePage() {
  const { expenses } = useExpenses();
  return (
    <>
      <h2>Add Expense</h2>
      <AddExpense />
      <ExpenseList expenses={expenses} />
    </>
  );
}
