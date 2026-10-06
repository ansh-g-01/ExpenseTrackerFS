import { useState } from "react";
import ExpenseList from "../../components/ExpenseList/ExpenseList";
import { useExpenses } from "../../hooks/useExpenses";
import { WEEKDAY_LABELS, endOfMonth, parseISODate, startOfMonth, toISODate } from "../../utils/date";

type DateRange = readonly [Date, Date];

const PRESETS: { label: string; range: (t: Date) => DateRange }[] = [
  { label: "This month", range: (t: Date) => [startOfMonth(t), endOfMonth(t)] },
  { label: "Last month", range: (t: Date) => { const m = new Date(t.getFullYear(), t.getMonth() - 1, 1); return [m, endOfMonth(m)]; } },
  { label: "Last 3 months", range: (t: Date) => [new Date(t.getFullYear(), t.getMonth() - 2, 1), endOfMonth(t)] },
  { label: "This year", range: (t: Date) => [new Date(t.getFullYear(), 0, 1), new Date(t.getFullYear(), 11, 31)] },
];
import "./HistoryPage.css";

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export default function HistoryPage() {
  const { expenses, categories } = useExpenses();

  const today = new Date();
  const defaultFrom = toISODate(startOfMonth(today));
  const defaultTo = toISODate(endOfMonth(today));

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [skipDays, setSkipDays] = useState<number[]>([]);
  const [skipCategories, setSkipCategories] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const min = minAmount === "" ? -Infinity : Number(minAmount);
  const max = maxAmount === "" ? Infinity : Number(maxAmount);

  const filtered = expenses.filter(
    (e) =>
      (!from || e.date >= from) &&
      (!to || e.date <= to) &&
      !skipDays.includes(parseISODate(e.date).getDay()) &&
      !skipCategories.includes(e.category) &&
      e.amount >= min &&
      e.amount <= max,
  );
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const applyPreset = (range: (t: Date) => DateRange) => {
    const [start, end] = range(today);
    setFrom(toISODate(start));
    setTo(toISODate(end));
  };

  const reset = () => {
    setFrom(defaultFrom);
    setTo(defaultTo);
    setSkipDays([]);
    setSkipCategories([]);
    setMinAmount("");
    setMaxAmount("");
  };

  return (
    <>
      <h2>Expenditure History</h2>

      <section className="filters">
        <div className="presets">
          {PRESETS.map(({ label, range }) => (
            <button key={label} type="button" className="preset" onClick={() => applyPreset(range)}>
              {label}
            </button>
          ))}
          <button type="button" className="preset" onClick={() => { setFrom(""); setTo(""); }}>
            All time
          </button>
        </div>

        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="from">From</label>
            <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="to">To</label>
            <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="min">Min amount</label>
            <input id="min" type="number" min="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="max">Max amount</label>
            <input id="max" type="number" min="0" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
        </div>

        <fieldset>
          <legend>Skip days</legend>
          {WEEKDAY_LABELS.map((label, day) => (
            <label key={label} className="chip">
              <input type="checkbox" checked={skipDays.includes(day)} onChange={() => setSkipDays(toggle(skipDays, day))} />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Skip categories</legend>
          {categories.map((category) => (
            <label key={category} className="chip">
              <input
                type="checkbox"
                checked={skipCategories.includes(category)}
                onChange={() => setSkipCategories(toggle(skipCategories, category))}
              />
              {category}
            </label>
          ))}
        </fieldset>

        <button type="button" className="link-button" onClick={reset}>Reset filters</button>
      </section>

      <p className="summary">
        {filtered.length} expense{filtered.length === 1 ? "" : "s"} · Total <strong>{total}</strong>
      </p>

      {filtered.length === 0 ? <p>No expenses match these filters.</p> : <ExpenseList expenses={filtered} />}
    </>
  );
}
