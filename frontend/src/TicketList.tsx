import { updateTicket } from "./api";
import type { Status, Ticket } from "./api";

interface Props {
  tickets: Ticket[];
  page: number;
  limit: number;
  total: number;
  statusFilter: Status | "";
  onStatusFilterChange: (status: Status | "") => void;
  onPageChange: (page: number) => void;
  onChanged: () => void;
}

const STATUS_OPTIONS: Status[] = ["open", "in_progress", "closed"];

export function TicketList({ tickets, page, limit, total, statusFilter, onStatusFilterChange, onPageChange, onChanged }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function handleStatusChange(id: number, status: Status) {
    await updateTicket(id, { status });
    onChanged();
  }

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <h2>Tickets ({total})</h2>
        <label>
          Filter by status
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as Status | "")}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
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
                <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value as Status)}>
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
