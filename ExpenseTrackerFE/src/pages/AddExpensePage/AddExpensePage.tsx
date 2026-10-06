import AddExpense from "../../components/AddExpense/AddExpense";
import ExpenseList from "../../components/ExpenseList/ExpenseList";
import { useExpenseList } from "../../hooks/useExpenseList";

export default function AddExpensePage() {
  const list = useExpenseList();
  return (
    <>
      <h2>Add Expense</h2>
      <AddExpense />
      <ExpenseList list={list} />
    </>
  );
}
