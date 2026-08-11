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
  onRowClick: (ticket: Ticket) => void;
}

const STATUS_OPTIONS: Status[] = ["open", "in_progress", "closed"];
const STATUS_LABELS: Record<Status, string> = { open: "Open", in_progress: "In progress", closed: "Closed" };
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "priority", label: "Priority, high first" },
];

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeTime(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 45) return "just now";
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (seconds >= secondsInUnit) {
      return relativeFormatter.format(-Math.round(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

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
  onRowClick,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isFiltered = statusFilter !== "" || searchInput.trim() !== "";

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <h2>
          Tickets <span className="ticket-count">{total}</span>
        </h2>
        <div className="ticket-list-controls">
          <input
            type="search"
            placeholder="Search title…"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
          />
          <label>
            Status
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as Status | "")}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select className="select-control" value={sort} onChange={(e) => onSortChange(e.target.value as Sort)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="ticket-row" onClick={() => onRowClick(t)}>
                <td className="col-id mono">#{String(t.id).padStart(2, "0")}</td>
                <td className="col-title">{t.title}</td>
                <td>
                  <span className={`badge priority-${t.priority}`}>{t.priority}</span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className={`select-control status-select status-${t.status}`}
                    value={t.status}
                    onChange={(e) => onStatusChange(t.id, e.target.value as Status)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="mono col-created" title={new Date(t.createdAt).toLocaleString()}>
                  {relativeTime(t.createdAt)}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  {isFiltered ? "No tickets match. Try clearing the search or status filter." : "No tickets yet. Create the first one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pager-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Prev
        </button>
        <span className="pager-status mono">
          {page} / {totalPages}
        </span>
        <button className="pager-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}
