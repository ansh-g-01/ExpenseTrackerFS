# Expense Tracker API

Express 5 + TypeScript + Prisma backend on PostgreSQL (Neon). Implements [API_SPEC.md](./API_SPEC.md).

## Setup

```bash
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install               # also runs `prisma generate`
npm run db:migrate        # applies prisma/migrations to the database
npm run db:seed           # optional: 30 demo expenses for the local user (--reset to replace)
npm run dev               # http://localhost:3000
```

Then run the frontend (`cd ../ExpenseTrackerFE && npm run dev`). Vite proxies `/api` to `http://localhost:3000`, so open http://localhost:5173. To point it elsewhere, set `VITE_API_PROXY_TARGET` for dev or `VITE_API_URL` for a production build.

On Neon, `DATABASE_URL` is the **pooled** connection string (host contains `-pooler`), and `DIRECT_URL` is the same string without `-pooler`. Prisma migrations need the direct connection.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run typecheck` | Type-check without emitting |
| `npm run db:migrate` | Apply pending migrations (deploy-safe) |
| `npm run db:migrate:dev` | Create a new migration after editing `schema.prisma` |
| `npm run db:seed` | Insert 30 demo expenses for the local user (skips if it already has some; `-- --reset` replaces them) |
| `npm run db:studio` | Browse the data in Prisma Studio |

## Authentication modes

All data is scoped to a user. `AUTH_REQUIRED` controls what happens when a request has no token:

- `false` (default): the request acts as a built-in **local user**, created on first use and seeded with the default categories. This lets the current frontend, which has no login, work unchanged. A valid `Authorization: Bearer <token>` is still honoured.
- `true`: `/api/categories`, `/api/expenses` and `/api/analytics` return **401** without a valid token.

`POST /api/auth/register` seeds the default categories (Food, Travel, Bills, Shopping, Other) for each new user. Tokens are stateless JWTs valid for 7 days, so `logout` just returns 204 and the client discards the token.

## Notes

- `expenses.date` is a Postgres `DATE` and `amount` is `DECIMAL(12,2)`. Weekday filtering and grouping use `EXTRACT(... FROM date)` on the stored calendar date, so no timezone conversion happens.
- Category names are unique per user, case-insensitively. A functional unique index on `(user_id, lower(name))` enforces this; it's in the init migration.
- Indexes: `expenses(date)`, `expenses(category_id)`, `expenses(user_id, date)`.
- CORS origin comes from `CORS_ORIGIN` (comma-separated for several origins).

## Layout

```
src/
  server.ts            entry point
  app.ts               express app, middleware, route mounting
  config.ts / db.ts    env config, Prisma client
  middleware/          auth (token/local-user resolution), error handler
  routes/              auth, categories, expenses, analytics
  lib/                 errors, date helpers, query parsing, serializers, user seeding
prisma/
  schema.prisma
  migrations/
```
