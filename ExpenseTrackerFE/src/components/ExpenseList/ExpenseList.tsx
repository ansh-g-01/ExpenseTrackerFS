import type { ExpenseSort } from "../../types/expense";
import { PAGE_SIZE, type ExpenseList as ExpenseListState } from "../../hooks/useExpenseList";
import ExpenseItem from "./ExpenseItem";
import Pagination from "../Pagination/Pagination";
import "./ExpenseList.css";

interface ExpenseListProps {
  list: ExpenseListState;
  emptyMessage?: string;
}

export default function ExpenseList({ list, emptyMessage = "No expenses yet." }: ExpenseListProps) {
  const { data, error, loading, sort, setSort, page, setPage } = list;

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p>Loading…</p>;
  if (data.totalItems === 0) return <p>{emptyMessage}</p>;

  return (
    <div aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
      <div className="sort-bar">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as ExpenseSort)}>
          <option value="date_desc">Date (newest first)</option>
          <option value="date_asc">Date (oldest first)</option>
          <option value="amount_desc">Amount (high to low)</option>
          <option value="amount_asc">Amount (low to high)</option>
        </select>
      </div>
      <table>
        <tbody>
          {data.items.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={data.totalItems} onPageChange={setPage} />
    </div>
  );
}
