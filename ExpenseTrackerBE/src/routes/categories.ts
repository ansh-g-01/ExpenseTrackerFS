import { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { ApiError, notFound, validationError } from "../lib/errors.js";
import { serializeCategory } from "../lib/serialize.js";
import { currentUserId } from "../middleware/auth.js";

const MAX_NAME_LENGTH = 50;
const categoryExists = () => new ApiError(409, "CATEGORY_EXISTS", "Category already exists");
const inUse = (name: string, count: number) =>
  new ApiError(409, "CATEGORY_IN_USE", `"${name}" is used by ${count} expense${count === 1 ? "" : "s"} and can't be deleted`);

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: currentUserId(req) },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { _count: { select: { expenses: true } } },
  });
  res.json(categories.map((c) => serializeCategory(c, c._count.expenses)));
});

categoriesRouter.post("/", async (req, res) => {
  const userId = currentUserId(req);
  const raw = req.body?.name;
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) throw validationError("Category name is required");
  if (name.length > MAX_NAME_LENGTH) throw validationError(`Category name must be ${MAX_NAME_LENGTH} characters or fewer`);

  const existing = await prisma.category.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) throw categoryExists();

  try {
    const category = await prisma.category.create({ data: { name, userId } });
    res.status(201).json(serializeCategory(category, 0));
  } catch (err) {
    // A concurrent insert can still hit the (user_id, lower(name)) unique index.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw categoryExists();
    throw err;
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  const where = { id: req.params.id, userId: currentUserId(req) };
  const category = await prisma.category.findFirst({ where, include: { _count: { select: { expenses: true } } } });
  if (!category) throw notFound("Category not found");
  if (category._count.expenses > 0) throw inUse(category.name, category._count.expenses);

  try {
    await prisma.category.delete({ where: { id: category.id } });
  } catch (err) {
    // An expense was added between the check and the delete (FK is ON DELETE RESTRICT).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw inUse(category.name, await prisma.expense.count({ where: { categoryId: category.id } }));
    }
    throw err;
  }
  res.status(204).end();
});
