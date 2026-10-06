import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { withQuery } from "../../api/client";
import { useApiGet } from "../../hooks/useApiGet";
import { useExpenses } from "../../hooks/useExpenses";
import type { Analytics } from "../../types/expense";
import { toMonthString } from "../../utils/date";
import "./AnalyticsPage.css";

type View = "daily" | "monthly" | "yearly";

const VIEWS: { value: View; label: string }[] = [
  { value: "daily", label: "Day wise" },
  { value: "monthly", label: "Month wise" },
  { value: "yearly", label: "Year wise" },
];

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

export default function AnalyticsPage() {
  const { version } = useExpenses();
  const now = new Date();

  const [view, setView] = useState<View>("monthly");
  const [month, setMonth] = useState(toMonthString(now));
  const [year, setYear] = useState(String(now.getFullYear()));

  // Day wise -> one month, month wise -> one year, year wise -> everything.
  // Skip the request while the month/year input holds an incomplete value.
  const path =
    view === "daily" ? (/^\d{4}-\d{2}$/.test(month) ? withQuery("/analytics", { view, month }) : null)
    : view === "monthly" ? (/^\d{4}$/.test(year) ? withQuery("/analytics", { view, year }) : null)
    : withQuery("/analytics", { view });
  const { data, error } = useApiGet<Analytics>(path, version);

  return (
    <>
      <h2>Expenses</h2>

      <div className="analytics-controls">
        <div className="view-toggle" role="group" aria-label="Chart view">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={view === value ? "active" : ""}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "daily" && (
          <input type="month" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} />
        )}
        {view === "monthly" && (
          <input
            type="number"
            aria-label="Year"
            min="1970"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        )}
      </div>

      {path === null && <p>Enter a {view === "daily" ? "month" : "year"} to see spending.</p>}
      {path !== null && error && <p className="error" role="alert">{error}</p>}
      {path !== null && !error && !data && <p>Loading…</p>}
      {path !== null && !error && data && <AnalyticsCharts data={data} viewLabel={VIEWS.find((v) => v.value === view)?.label} />}
    </>
  );
}

function AnalyticsCharts({ data, viewLabel }: { data: Analytics; viewLabel?: string }) {
  const { total, count, timeSeries: timeData, byCategory: categoryData } = data;
  const periodLabel = data.period.label;

  return (
    <>
      <p className="summary">
        Total for {periodLabel}: <strong>{total}</strong> across {count} expense
        {count === 1 ? "" : "s"}
      </p>

      <section className="chart-card">
        <h3>{viewLabel} spending</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar isAnimationActive={false} dataKey="total" name="Spent" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="chart-card">
        <h3>By category ({periodLabel})</h3>
        {categoryData.length === 0 ? (
          <p>No expenses in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie isAnimationActive={false} data={categoryData} dataKey="total" nameKey="label" outerRadius={100}>
                {categoryData.map((entry, i) => (
                  <Cell key={entry.categoryId} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>
    </>
  );
}
