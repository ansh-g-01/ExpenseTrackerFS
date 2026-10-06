// Seeds 30 demo expenses for the built-in local user (the one used when
// AUTH_REQUIRED=false). Run with `npm run db:seed`; pass `--reset` to wipe the
// local user's existing expenses first. Deterministic, so reruns look the same.
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db.js";
import { getLocalUserId } from "../src/lib/users.js";

const COUNT = 30;
const ITEMS: Record<string, { names: string[]; min: number; max: number }> = {
  Food: { names: ["Lunch", "Groceries", "Dinner out", "Coffee", "Snacks", "Pizza"], min: 80, max: 900 },
  Travel: { names: ["Uber", "Metro pass", "Petrol", "Train ticket", "Auto"], min: 60, max: 1500 },
  Bills: { names: ["Electricity", "Internet", "Phone recharge", "Water bill"], min: 300, max: 2500 },
  Shopping: { names: ["T-shirt", "Shoes", "Headphones", "Books", "Gift"], min: 250, max: 3500 },
  Other: { names: ["Gym", "Movie", "Medicine", "Haircut"], min: 100, max: 1200 },
};

let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];

/** Dates are built from local calendar parts and stored at UTC midnight (Postgres DATE). */
const dbDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

async function main() {
  const userId = await getLocalUserId();
  const reset = process.argv.includes("--reset");

  const existing = await prisma.expense.count({ where: { userId } });
  if (existing > 0 && !reset) {
    console.log(`Local user already has ${existing} expenses; skipping. Use --reset to replace them.`);
    return;
  }
  if (reset) await prisma.expense.deleteMany({ where: { userId } });

  const categories = await prisma.category.findMany({ where: { userId } });
  const byName = new Map(categories.map((c) => [c.name, c.id]));

  // About a third land in the current month (the History page's default range),
  // the rest spread over the previous 13 months for the monthly and yearly charts.
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < COUNT; i++) {
    if (i < 10) {
      dates.push(dbDate(today.getFullYear(), today.getMonth(), 1 + Math.floor(rand() * today.getDate())));
    } else {
      const monthsAgo = 1 + Math.floor(rand() * 13);
      const first = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      dates.push(dbDate(first.getFullYear(), first.getMonth(), 1 + Math.floor(rand() * days)));
    }
  }
  dates.sort((a, b) => a.getTime() - b.getTime());

  const now = Date.now();
  const data = dates.map((date, i) => {
    const category = pick(Object.keys(ITEMS).filter((name) => byName.has(name)));
    const { names, min, max } = ITEMS[category];
    return {
      userId,
      categoryId: byName.get(category)!,
      name: pick(names),
      amount: new Prisma.Decimal(Math.round((min + rand() * (max - min)) / 10) * 10),
      date,
      createdAt: new Date(now - (COUNT - i) * 60_000),
    };
  });

  await prisma.expense.createMany({ data });
  console.log(`Seeded ${data.length} expenses for the local user.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
