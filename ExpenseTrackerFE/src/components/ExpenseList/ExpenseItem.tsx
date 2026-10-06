import type { Expense } from "../../types/expense";

export default function ExpenseItem({ expense }: { expense: Expense }) {
  return (
    <tr>
      <td>{expense.name}</td>
      <td><span className="badge">{expense.categoryName}</span></td>
      <td>{expense.date}</td>
      <td>{expense.amount}</td>
    </tr>
  );
}
