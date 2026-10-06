import "./Pagination.css";

interface PaginationProps {
  page: number; // 1-based
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

/** 1 … 4 5 [6] 7 8 … 20 — always shows first, last and the pages around the current one. */
function pageList(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export default function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-info">
        Showing {first}–{last} of {totalItems}
      </span>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
            Prev
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="pagination-gap">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={p === page ? "active" : ""}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </nav>
  );
}
