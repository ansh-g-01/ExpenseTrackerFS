// Calendar dates are handled as plain YYYY-MM-DD strings. Postgres DATE values
// come back from Prisma as Date objects at UTC midnight, so UTC accessors give
// back the date exactly as written, with no timezone shift.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YEAR_RE = /^\d{4}$/;

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export const isValidMonth = (value: unknown): value is string => typeof value === "string" && MONTH_RE.test(value);
export const isValidYear = (value: unknown): value is string => typeof value === "string" && YEAR_RE.test(value) && value !== "0000";

/** "2026-10-05" -> Date at 2026-10-05T00:00:00Z, suitable for a DATE column. */
export const toDbDate = (value: string) => new Date(`${value}T00:00:00Z`);

/** Date from a DATE column -> "2026-10-05". */
export const fromDbDate = (date: Date) => date.toISOString().slice(0, 10);

export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
