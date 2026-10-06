import { useState } from "react";
import type { FormEvent } from "react";
import { errorMessage } from "../../api/client";
import { useExpenses } from "../../hooks/useExpenses";
import type { Category } from "../../types/expense";
import "./CategoriesPage.css";

export default function CategoriesPage() {
  const { categories, categoriesLoading, categoriesError, addCategory, deleteCategory } = useExpenses();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      setError("");
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Category name is required"); return; }
    if (await run(() => addCategory(name))) setName("");
  };

  const handleDelete = (category: Category) => run(() => deleteCategory(category.id));

  return (
    <>
      <h2>Categories</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="new-category">New category</label>
          <input
            id="new-category"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>Add Category</button>
      </form>

      {categoriesError && <p className="error" role="alert">{categoriesError}</p>}
      {categoriesLoading && <p>Loading…</p>}

      <ul className="category-list">
        {categories.map((category) => {
          const count = category.expenseCount;
          return (
            <li key={category.id}>
              <span>{category.name}</span>
              <span className="category-actions">
                <span className="category-count">{count} expense{count === 1 ? "" : "s"}</span>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(category)}
                  disabled={busy || count > 0}
                  title={count > 0 ? `In use by ${count} expense${count === 1 ? "" : "s"}` : "Delete category"}
                  aria-label={`Delete ${category.name}`}
                >
                  Delete
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
