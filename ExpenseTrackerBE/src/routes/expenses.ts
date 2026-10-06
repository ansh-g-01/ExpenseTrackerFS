import { Prisma } from "@prisma/client";
import { Router, type Request } from "express";
import { prisma } from "../db.js";
import { isValidDate, toDbDate } from "../lib/dates.js";
import { notFound, validationError } from "../lib/errors.js";
import { queryInt, queryList, queryNumber, queryString } from "../lib/query.js";
import { serializeExpense, toNumber } from "../lib/serialize.js";
import { currentUserId } from "../middleware/auth.js";

const MAX_NAME_LENGTH = 100;
const MAX_AMOUNT = 9_999_999_999.99; // DECIMAL(12,2)

const SORTS = {
  date_desc: Prisma.sql`e.date DESC, e.created_at DESC, e.id DESC`,
  date_asc: Prisma.sql`e.date ASC, e.created_at DESC, e.id DESC`,
  amount_desc: Prisma.sql`e.amount DESC, e.created_at DESC, e.id DESC`,
  amount_asc: Prisma.sql`e.amount ASC, e.created_at DESC, e.id DESC`,
} as const;

/** Validates a POST/PUT body. Checks run in the spec's field order and the first failure is reported. */
async function parseExpenseBody(body: unknown, userId: string) {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) throw validationError("Name is required");
  if (name.length > MAX_NAME_LENGTH) throw validationError(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);

  const categoryId = typeof b.categoryId === "string" ? b.categoryId.trim() : "";
  const category = categoryId
    ? await prisma.category.findFirst({ where: { id: categoryId, userId }, select: { id: true } })
    : null;
  if (!category) throw validationError("Category is required");

  const amount = b.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw validationError("Amount must be greater than 0");
  }
  if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
    throw validationError("Amount can have at most 2 decimal places");
  }
  if (amount > MAX_AMOUNT) throw validationError("Amount is too large");

  if (!isValidDate(b.date)) throw validationError("Date is required");

  return { name, categoryId, amount: new Prisma.Decimal(amount.toFixed(2)), date: toDbDate(b.date) };
}

function parseListFilters(req: Request, userId: string) {
  const from = queryString(req, "from");
  const to = queryString(req, "to");
  if (from !== undefined && !isValidDate(from)) throw validationError("\"from\" must be a valid date (YYYY-MM-DD)");
  if (to !== undefined && !isValidDate(to)) throw validationError("\"to\" must be a valid date (YYYY-MM-DD)");
  if (from && to && from > to) throw validationError("Start date can't be after end date");

  const minAmount = queryNumber(req, "minAmount", "Minimum amount");
  const maxAmount = queryNumber(req, "maxAmount", "Maximum amount");
  if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
    throw validationError("Minimum amount can't be greater than maximum amount");
  }

  const excludeCategoryIds = queryList(req, "excludeCategoryIds");
  const excludeWeekdays = queryList(req, "excludeWeekdays").map((d) => {
    if (!/^[0-6]$/.test(d)) throw validationError("Weekdays must be numbers from 0 (Sunday) to 6 (Saturday)");
    return Number(d);
  });

  const sortKey = queryString(req, "sort") ?? "date_desc";
  if (!(sortKey in SORTS)) throw validationError(`Sort must be one of: ${Object.keys(SORTS).join(", ")}`);

  const conditions: Prisma.Sql[] = [Prisma.sql`e.user_id = ${userId}`];
  if (from) conditions.push(Prisma.sql`e.date >= ${from}::date`);
  if (to) conditions.push(Prisma.sql`e.date <= ${to}::date`);
  if (minAmount !== undefined) conditions.push(Prisma.sql`e.amount >= ${minAmount}::numeric`);
  if (maxAmount !== undefined) conditions.push(Prisma.sql`e.amount <= ${maxAmount}::numeric`);
  if (excludeCategoryIds.length) conditions.push(Prisma.sql`e.category_id NOT IN (${Prisma.join(excludeCategoryIds)})`);
  // EXTRACT(DOW) on a DATE uses the calendar date as stored: 0 = Sunday.
  if (excludeWeekdays.length) conditions.push(Prisma.sql`EXTRACT(DOW FROM e.date)::int NOT IN (${Prisma.join(excludeWeekdays)})`);

  return {
    where: Prisma.join(conditions, " AND "),
    orderBy: SORTS[sortKey as keyof typeof SORTS],
    page: queryInt(req, "page", "Page", 1, Number.MAX_SAFE_INTEGER, 1),
    pageSize: queryInt(req, "pageSize", "Page size", 1, 100, 10),
  };
}

type ExpenseRow = {
  id: string;
  name: string;
  amount: Prisma.Decimal;
  category_id: string;
  category_name: string;
  date: string;
  created_at: Date;
};

export const expensesRouter = Router();

expensesRouter.get("/", async (req, res) => {
  const { where, orderBy, page: requestedPage, pageSize } = parseListFilters(req, currentUserId(req));

  const [summary] = await prisma.$queryRaw<{ count: number; total: Prisma.Decimal }[]>`
    SELECT COUNT(*)::int AS count, COALESCE(SUM(e.amount), 0) AS total
    FROM expenses e WHERE ${where}`;
  const totalItems = summary.count;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages); // past the end -> last page

  const rows = await prisma.$queryRaw<ExpenseRow[]>`
    SELECT e.id, e.name, e.amount, e.category_id, c.name AS category_name,
           to_char(e.date, 'YYYY-MM-DD') AS date, e.created_at
    FROM expenses e JOIN categories c ON c.id = e.category_id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

  res.json({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: toNumber(r.amount),
      categoryId: r.category_id,
      categoryName: r.category_name,
      date: r.date,
      createdAt: r.created_at.toISOString(),
    })),
    page,
    pageSize,
    totalItems,
    totalPages,
    totalAmount: toNumber(summary.total),
  });
});

expensesRouter.post("/", async (req, res) => {
  const userId = currentUserId(req);
  const data = await parseExpenseBody(req.body, userId);
  const expense = await prisma.expense.create({ data: { ...data, userId }, include: { category: true } });
  res.status(201).json(serializeExpense(expense));
});

async function findOwnExpense(req: Request) {
  const expense = await prisma.expense.findFirst({
    where: { id: String(req.params.id), userId: currentUserId(req) },
    include: { category: true },
  });
  if (!expense) throw notFound("Expense not found");
  return expense;
}

expensesRouter.get("/:id", async (req, res) => {
  res.json(serializeExpense(await findOwnExpense(req)));
});

expensesRouter.put("/:id", async (req, res) => {
  const existing = await findOwnExpense(req);
  const data = await parseExpenseBody(req.body, existing.userId);
  const expense = await prisma.expense.update({ where: { id: existing.id }, data, include: { category: true } });
  res.json(serializeExpense(expense));
});

expensesRouter.delete("/:id", async (req, res) => {
  const existing = await findOwnExpense(req);
  await prisma.expense.delete({ where: { id: existing.id } });
  res.status(204).end();
});
