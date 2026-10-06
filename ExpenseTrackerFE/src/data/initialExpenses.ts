import type { Expense } from "../types/expense";
import { toISODate } from "../utils/date";

// Demo data: ~14 months of spending ending today, so the history page (current
// month) and every chart have something to show. Seeded, so it is the same each run.
const ITEMS: Record<string, { names: string[]; min: number; max: number }> = {
  Food: { names: ["Lunch", "Groceries", "Dinner out", "Coffee", "Snacks", "Pizza"], min: 80, max: 900 },
  Travel: { names: ["Uber", "Metro pass", "Petrol", "Train ticket", "Auto"], min: 60, max: 1500 },
  Bills: { names: ["Electricity", "Internet", "Phone recharge", "Water bill"], min: 300, max: 2500 },
  Shopping: { names: ["T-shirt", "Shoes", "Headphones", "Books", "Gift"], min: 250, max: 3500 },
  Other: { names: ["Gym", "Movie", "Medicine", "Haircut"], min: 100, max: 1200 },
};

function generate(): Expense[] {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const categories = Object.keys(ITEMS);
  const today = new Date();
  const expenses: Expense[] = [];

  for (let daysAgo = 0; daysAgo < 14 * 30; daysAgo++) {
    if (rand() > 0.55) continue; // not every day has an expense
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    const count = rand() > 0.8 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(rand() * categories.length)];
      const { names, min, max } = ITEMS[category];
      expenses.push({
        id: `seed-${expenses.length}`,
        name: names[Math.floor(rand() * names.length)],
        category,
        amount: Math.round((min + rand() * (max - min)) / 10) * 10,
        date: toISODate(date),
      });
    }
  }
  return expenses;
}

export const initialExpenses: Expense[] = generate();
