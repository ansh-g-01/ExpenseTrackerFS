import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { resolveUser } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { expensesRouter } from "./routes/expenses.js";

export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", resolveUser, categoriesRouter);
app.use("/api/expenses", resolveUser, expensesRouter);
app.use("/api/analytics", resolveUser, analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
