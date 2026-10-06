export interface Category {
  id: string;
  name: string;
  expenseCount: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
}

export type NewExpense = Pick<Expense, "name" | "amount" | "categoryId" | "date">;

export type ExpenseSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export interface ExpensePage {
  items: Expense[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  totalAmount: number;
}

export interface ChartPoint {
  label: string;
  total: number;
}

export interface Analytics {
  period: { view: "daily" | "monthly" | "yearly"; label: string };
  total: number;
  count: number;
  timeSeries: ChartPoint[];
  byCategory: (ChartPoint & { categoryId: string })[];
}
