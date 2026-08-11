import type { Sort, Status, Ticket } from "./api";

interface Props {
  tickets: Ticket[];
  page: number;
  limit: number;
  total: number;
  statusFilter: Status | "";
  sort: Sort;
  searchInput: string;
  onStatusFilterChange: (status: Status | "") => void;
  onSortChange: (sort: Sort) => void;
  onSearchInputChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (id: number, status: Status) => void;
}

const STATUS_OPTIONS: Status[] = ["open", "in_progress", "closed"];
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "priority", label: "Priority (high first)" },
];

export function TicketList({
  tickets,
  page,
  limit,
  total,
  statusFilter,
  sort,
  searchInput,
  onStatusFilterChange,
  onSortChange,
  onSearchInputChange,
  onPageChange,
  onStatusChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <h2>Tickets ({total})</h2>
        <div className="ticket-list-controls">
          <input
            type="search"
            placeholder="Search title…"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
          />
          <label>
            Status
            <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as Status | "")}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select value={sort} onChange={(e) => onSortChange(e.target.value as Sort)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>
                <span className={`badge priority-${t.priority}`}>{t.priority}</span>
              </td>
              <td>
                <select value={t.status} onChange={(e) => onStatusChange(t.id, e.target.value as Status)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>{new Date(t.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan={4}>No tickets found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
