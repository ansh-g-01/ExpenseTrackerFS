import { prisma } from "../db.js";

export const DEFAULT_CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Other"];
export const LOCAL_USER_EMAIL = "local@expense-tracker.internal";

type Tx = Pick<typeof prisma, "category">;

/** Seeds the default categories for a new user, keeping them in creation order. */
export async function seedDefaultCategories(tx: Tx, userId: string) {
  const base = Date.now();
  await tx.category.createMany({
    data: DEFAULT_CATEGORIES.map((name, i) => ({ name, userId, createdAt: new Date(base + i) })),
    skipDuplicates: true,
  });
}

let localUserId: string | undefined;

/** The single built-in user that owns data when AUTH_REQUIRED is false. */
export async function getLocalUserId(): Promise<string> {
  if (localUserId) return localUserId;
  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: LOCAL_USER_EMAIL } });
    if (existing) return existing;
    const created = await tx.user.create({ data: { name: "Local User", email: LOCAL_USER_EMAIL } });
    await seedDefaultCategories(tx, created.id);
    return created;
  });
  localUserId = user.id;
  return user.id;
}
