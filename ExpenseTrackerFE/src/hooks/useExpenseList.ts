import { useState } from "react";
import { withQuery } from "../api/client";
import type { ExpensePage, ExpenseSort } from "../types/expense";
import { useApiGet } from "./useApiGet";
import { useExpenses } from "./useExpenses";

export const PAGE_SIZE = 10;

export interface ExpenseFilters {
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
  excludeCategoryIds?: string[];
  excludeWeekdays?: number[];
}

/** Server-side filtered, sorted and paginated expenses. */
export function useExpenseList(filters: ExpenseFilters = {}) {
  const { version } = useExpenses();
  const [sort, setSort] = useState<ExpenseSort>("date_desc");
  const [requestedPage, setRequestedPage] = useState(1);

  // The server clamps a page past the end to the last page, so a filter that
  // shrinks the results never leaves us on a page that no longer exists.
  const path = withQuery("/expenses", { ...filters, sort, page: requestedPage, pageSize: PAGE_SIZE });
  const { data, error, loading } = useApiGet<ExpensePage>(path, version);

  return {
    data,
    error,
    loading,
    sort,
    page: data?.page ?? requestedPage,
    setPage: setRequestedPage,
    setSort: (next: ExpenseSort) => {
      setSort(next);
      setRequestedPage(1);
    },
  };
}

export type ExpenseList = ReturnType<typeof useExpenseList>;
