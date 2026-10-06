import { useState } from "react";
import type { FormEvent } from "react";
import { useExpenses } from "../../hooks/useExpenses";
import "./CategoriesPage.css";

export default function CategoriesPage() {
  const { expenses, categories, addCategory, deleteCategory } = useExpenses();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = addCategory(name);
    setError(err ?? "");
    if (!err) setName("");
  };

  const handleDelete = (category: string) => {
    setError(deleteCategory(category) ?? "");
  };

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
        <button type="submit">Add Category</button>
      </form>

      <ul className="category-list">
        {categories.map((category) => {
          const count = expenses.filter((e) => e.category === category).length;
          return (
            <li key={category}>
              <span>{category}</span>
              <span className="category-actions">
                <span className="category-count">{count} expense{count === 1 ? "" : "s"}</span>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(category)}
                  disabled={count > 0}
                  title={count > 0 ? `In use by ${count} expense${count === 1 ? "" : "s"}` : "Delete category"}
                  aria-label={`Delete ${category}`}
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
