# Expense Tracker — Backend API Spec

This lists the APIs the frontend needs to replace its current localStorage storage.
Base path: `/api`. All bodies are JSON.

## Conventions

- **Dates** are calendar dates as `YYYY-MM-DD` strings with no time or timezone. Store them as a `DATE` column, not a timestamp. Weekday filters and day/month/year grouping must use this date as written, never a UTC-converted one.
- **Months** are `YYYY-MM`, **years** are `YYYY`.
- **Amounts** are positive numbers (up to 2 decimals). Store them as `DECIMAL(12,2)`, not float. There's no currency field yet.
- **IDs** are strings (UUIDs).
- **Errors** always use this shape. The frontend shows `message` directly to the user, so it must be human-readable:
  ```json
  { "error": { "code": "CATEGORY_IN_USE", "message": "\"Food\" is used by 12 expenses and can't be deleted" } }
  ```
  | Status | When |
  |---|---|
  | 400 | Validation failed (`VALIDATION_ERROR`) |
  | 404 | Resource not found (`NOT_FOUND`) |
  | 409 | Conflict (`CATEGORY_EXISTS`, `CATEGORY_IN_USE`) |

## Data models

```ts
Category {
  id: string
  name: string
  expenseCount: number   // number of expenses using this category
}

Expense {
  id: string
  name: string
  amount: number
  categoryId: string
  categoryName: string   // denormalised in responses so lists don't need a second lookup
  date: string           // YYYY-MM-DD
  createdAt: string      // ISO timestamp, used as a sort tie-breaker
}
```

---

## 1. Categories

Used on the **Category** page, the **Add Expense** dropdown, and the **History** "skip categories" filter.

### `GET /api/categories`
Returns every category, in creation order. Each one includes `expenseCount`, which the Category page shows ("12 expenses") and uses to disable the Delete button.

**200**
```json
[
  { "id": "c1", "name": "Food", "expenseCount": 42 },
  { "id": "c2", "name": "Travel", "expenseCount": 0 }
]
```

### `POST /api/categories`
```json
{ "name": "Health" }
```
- Trim `name` before storing it.
- **400** `VALIDATION_ERROR`, message `"Category name is required"`, when the trimmed name is empty.
- **409** `CATEGORY_EXISTS`, message `"Category already exists"`, when a category with the same name exists. The comparison is **case-insensitive**.

**201** returns the new `Category` with `expenseCount: 0`.

### `DELETE /api/categories/:id`
- **409** `CATEGORY_IN_USE` when any expense uses this category. The message should be `"\"<name>\" is used by N expense(s) and can't be deleted"`.
- **404** if the category doesn't exist.

**204** No Content.

> **Seed data:** start with the default categories `Food`, `Travel`, `Bills`, `Shopping` and `Other`. If users are added (see §4), seed them for each new user.

---

## 2. Expenses

### `GET /api/expenses`
This one endpoint serves both the **Add Expense** page (the list under the form, with no filters) and the **Expenditure History** page (with filters). It filters, sorts and paginates on the server.

| Query param | Type | Default | Description |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | none | Inclusive start date. Omit it for no lower bound. |
| `to` | `YYYY-MM-DD` | none | Inclusive end date. Omit it for no upper bound. |
| `minAmount` | number | none | Inclusive. |
| `maxAmount` | number | none | Inclusive. |
| `excludeCategoryIds` | comma-separated ids | none | Leave out expenses in these categories ("Skip categories"). |
| `excludeWeekdays` | comma-separated `0`–`6` | none | Leave out expenses whose date falls on these weekdays, where `0` = Sunday ("Skip days"). |
| `sort` | `date_desc` \| `date_asc` \| `amount_desc` \| `amount_asc` | `date_desc` | Ties are broken by `createdAt` descending, so the newest entry comes first. |
| `page` | integer ≥ 1 | `1` | If it's past the last page, return the last page. The frontend relies on this when a filter shrinks the result set. |
| `pageSize` | integer 1–100 | `10` | |

**200**
```json
{
  "items": [
    { "id": "e1", "name": "Lunch", "amount": 250, "categoryId": "c1", "categoryName": "Food", "date": "2026-10-05", "createdAt": "2026-10-05T13:02:11Z" }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 37,
  "totalPages": 4,
  "totalAmount": 18420
}
```
`totalItems` and `totalAmount` cover **all matching expenses, not only the current page**. The History page summary shows them ("37 expenses · Total 18420").

Invalid params (bad date format, `minAmount > maxAmount`, unknown `sort`, a weekday outside 0–6) → **400**.

### `POST /api/expenses`
```json
{ "name": "Lunch", "amount": 250, "categoryId": "c1", "date": "2026-10-05" }
```
Validation (each failure returns **400** `VALIDATION_ERROR` with this message):
| Field | Rule | Message |
|---|---|---|
| `name` | Required and non-empty after trim. Max 100 chars. | `Name is required` |
| `categoryId` | Required and must be an existing category. | `Category is required` |
| `amount` | Number > 0 | `Amount must be greater than 0` |
| `date` | Valid `YYYY-MM-DD` | `Date is required` |

**201** returns the created `Expense`.

### Recommended, not used by the UI yet
The frontend has no edit or delete for expenses yet. These will almost certainly be needed next, so it's worth building them now:
- `GET /api/expenses/:id` → `Expense`
- `PUT /api/expenses/:id` takes the same body and validation as POST → `Expense`
- `DELETE /api/expenses/:id` → 204

---

## 3. Analytics

Used by the **Expenses (analytics)** page. That page has three views, and each one shows a bar chart over time, a pie chart by category, and a summary line ("Total for 2026: 84,300 across 212 expenses"). One call returns everything for a view.

### `GET /api/analytics`

| Query param | Required | Description |
|---|---|---|
| `view` | yes | `daily` \| `monthly` \| `yearly` |
| `month` | when `view=daily` | `YYYY-MM` |
| `year` | when `view=monthly` | `YYYY` |

| `view` | Period covered | `timeSeries` points |
|---|---|---|
| `daily` | The given month | One per day of the month (28–31 points), with labels `"1"`…`"31"` |
| `monthly` | The given year | 12 points, with labels `"Jan"`…`"Dec"` |
| `yearly` | All time | One per year, from the earliest expense year to the later of the current year and the latest expense year. Labels are `"2025"`, `"2026"`, and so on. |

**Every point in the range must appear, with `total: 0` for periods that have no expenses.** The bar chart needs a continuous axis.

**200**
```json
{
  "period": { "view": "monthly", "label": "2026" },
  "total": 84300,
  "count": 212,
  "timeSeries": [
    { "label": "Jan", "total": 6100 },
    { "label": "Feb", "total": 0 }
  ],
  "byCategory": [
    { "categoryId": "c3", "label": "Shopping", "total": 31200 },
    { "categoryId": "c1", "label": "Food", "total": 22050 }
  ]
}
```
- `total`, `count` and `byCategory` cover only the selected period.
- `byCategory` is sorted by `total` descending and includes only categories with spending in the period. It's an empty array if there's none, which makes the page show "No expenses in this period."
- `period.label` is `"2026-10"` for daily, `"2026"` for monthly and `"all time"` for yearly.
- A missing or invalid `month`/`year` for the chosen view → **400**.

---

## 4. Authentication (needed if the app becomes multi-user)

The current app is single-user with no login. If the backend is meant to serve more than one person, add the following. Every endpoint above then requires `Authorization: Bearer <token>`, and every query is scoped to the logged-in user. That includes categories, so category-name uniqueness is per user.

- `POST /api/auth/register` `{ name, email, password }` → 201 `{ user, token }`. Returns 409 if the email is already taken.
- `POST /api/auth/login` `{ email, password }` → 200 `{ user, token }`. Returns 401 for invalid credentials.
- `POST /api/auth/logout` → 204
- `GET /api/auth/me` → `{ id, name, email }`. Returns 401 if the token is missing or expired.

---

## Summary

| # | Method | Endpoint | Used by |
|---|---|---|---|
| 1 | GET | `/api/categories` | Category page, Add Expense dropdown, History filters |
| 2 | POST | `/api/categories` | Category page |
| 3 | DELETE | `/api/categories/:id` | Category page |
| 4 | GET | `/api/expenses` | Add Expense list, History page |
| 5 | POST | `/api/expenses` | Add Expense form |
| 6 | GET | `/api/analytics` | Expenses (analytics) page |
| 7–9 | GET / PUT / DELETE | `/api/expenses/:id` | Recommended for future edit/delete |
| 10–13 | — | `/api/auth/*` | Only if the app goes multi-user |

**Non-functional:**
- Enable CORS for the Vite dev origin (`http://localhost:5173`).
- Add DB indexes on `expenses(date)` and `expenses(category_id)`, plus `(user_id, date)` if auth is added.
