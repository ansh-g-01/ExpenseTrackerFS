import { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { daysInMonth, isValidMonth, isValidYear } from "../lib/dates.js";
import { validationError } from "../lib/errors.js";
import { queryString } from "../lib/query.js";
import { toNumber } from "../lib/serialize.js";
import { currentUserId } from "../middleware/auth.js";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Bucket = { bucket: number; total: Prisma.Decimal; count: number };

export const analyticsRouter = Router();

analyticsRouter.get("/", async (req, res) => {
  const userId = currentUserId(req);
  const view = queryString(req, "view");

  // Each view defines the date range it covers and the unit it buckets by.
  let range: Prisma.Sql;
  let unit: "DAY" | "MONTH" | "YEAR";
  let label: string;
  let points: (rows: Map<number, number>) => { label: string; total: number }[];

  if (view === "daily") {
    const month = queryString(req, "month");
    if (!isValidMonth(month)) throw validationError("A valid month (YYYY-MM) is required for the daily view");
    const [y, m] = month.split("-").map(Number);
    const days = daysInMonth(y, m);
    range = Prisma.sql`AND e.date BETWEEN ${`${month}-01`}::date AND ${`${month}-${String(days).padStart(2, "0")}`}::date`;
    unit = "DAY";
    label = month;
    points = (rows) => Array.from({ length: days }, (_, i) => ({ label: String(i + 1), total: rows.get(i + 1) ?? 0 }));
  } else if (view === "monthly") {
    const year = queryString(req, "year");
    if (!isValidYear(year)) throw validationError("A valid year (YYYY) is required for the monthly view");
    range = Prisma.sql`AND e.date BETWEEN ${`${year}-01-01`}::date AND ${`${year}-12-31`}::date`;
    unit = "MONTH";
    label = year;
    points = (rows) => MONTH_LABELS.map((l, i) => ({ label: l, total: rows.get(i + 1) ?? 0 }));
  } else if (view === "yearly") {
    range = Prisma.empty;
    unit = "YEAR";
    label = "all time";
    points = (rows) => {
      const years = [...rows.keys()];
      const current = new Date().getFullYear();
      const first = years.length ? Math.min(...years) : current;
      const last = Math.max(current, ...years);
      return Array.from({ length: last - first + 1 }, (_, i) => ({ label: String(first + i), total: rows.get(first + i) ?? 0 }));
    };
  } else {
    throw validationError("View must be one of: daily, monthly, yearly");
  }

  const [buckets, byCategory] = await Promise.all([
    prisma.$queryRaw<Bucket[]>`
      SELECT EXTRACT(${Prisma.raw(unit)} FROM e.date)::int AS bucket, SUM(e.amount) AS total, COUNT(*)::int AS count
      FROM expenses e
      WHERE e.user_id = ${userId} ${range}
      GROUP BY bucket`,
    prisma.$queryRaw<{ category_id: string; name: string; total: Prisma.Decimal }[]>`
      SELECT c.id AS category_id, c.name, SUM(e.amount) AS total
      FROM expenses e JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ${userId} ${range}
      GROUP BY c.id, c.name
      ORDER BY total DESC, c.name ASC`,
  ]);

  const totals = new Map(buckets.map((b) => [b.bucket, toNumber(b.total)]));
  // Sum in cents to avoid floating-point drift across many 2-decimal amounts.
  const totalCents = buckets.reduce((sum, b) => sum + Math.round(toNumber(b.total) * 100), 0);

  res.json({
    period: { view, label },
    total: totalCents / 100,
    count: buckets.reduce((sum, b) => sum + b.count, 0),
    timeSeries: points(totals),
    byCategory: byCategory.map((c) => ({ categoryId: c.category_id, label: c.name, total: toNumber(c.total) })),
  });
});
