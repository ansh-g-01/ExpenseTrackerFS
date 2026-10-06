import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { errorMessage } from "../../api/client";
import { useExpenses } from "../../hooks/useExpenses";
import "./AddExpense.css";

interface FormFields {
  name: HTMLInputElement;
  category: HTMLSelectElement;
  amount: HTMLInputElement;
  date: HTMLInputElement;
}

export default function AddExpense() {
  const { categories, addExpense } = useExpenses();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = form.elements as unknown as FormFields;
    const name = fields.name.value;
    const categoryId = fields.category.value;
    const amount = parseFloat(fields.amount.value);
    const date = fields.date.value;

    if (!name.trim()) { setError("Name is required"); return; }
    if (!categoryId) { setError("Category is required"); return; }
    if (isNaN(amount) || amount <= 0) { setError("Amount must be greater than 0"); return; }
    if (!date) { setError("Date is required"); return; }

    setSubmitting(true);
    try {
      await addExpense({ name: name.trim(), categoryId, amount, date });
      setSuccess("Expense added successfully!");
      setError("");
      form.reset();
      nameRef.current?.focus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" maxLength={100} ref={nameRef} />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category">
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="number" step="0.01" min="0" />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" />
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {success && <p className="success" role="status">{success}</p>}
        <button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add Expense"}</button>
      </form>
    </div>
  );
}
