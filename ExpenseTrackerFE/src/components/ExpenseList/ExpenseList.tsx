import { useState } from "react";
import type { Expense } from "../../types/expense";
import ExpenseItem from "./ExpenseItem";
import Pagination from "../Pagination/Pagination";
import "./ExpenseList.css";

const PAGE_SIZE = 10;

export default function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const [sortBy, setSortBy] = useState("date-desc");
  const [requestedPage, setRequestedPage] = useState(1);

  const sortedExpenses = [...expenses].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":    return a.date.localeCompare(b.date);
      case "date-desc":   return b.date.localeCompare(a.date);
      case "amount-asc":  return a.amount - b.amount;
      case "amount-desc": return b.amount - a.amount;
      default:            return 0;
    }
  });

  // clamp, so a filter that shrinks the list never leaves us on a page that no longer exists
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageExpenses = sortedExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="sort-bar">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" value={sortBy} onChange={(e) => {
            setSortBy(e.target.value);
            setRequestedPage(1);
          }}>
          <option value="date-desc">Date (newest first)</option>
          <option value="date-asc">Date (oldest first)</option>
          <option value="amount-desc">Amount (high to low)</option>
          <option value="amount-asc">Amount (low to high)</option>
        </select>
      </div>
      <table>
        <tbody>
          {pageExpenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={sortedExpenses.length}
        onPageChange={setRequestedPage}
      />
    </div>
  );
}
