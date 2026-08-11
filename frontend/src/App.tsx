import { useCallback, useEffect, useState } from "react";
import { fetchStats, fetchTickets, updateTicket } from "./api";
import type { Sort, Stats, Status, Ticket } from "./api";
import { CreateTicketModal } from "./CreateTicketModal";
import { TicketDetailModal } from "./TicketDetailModal";
import { EditTicketModal } from "./EditTicketModal";
import { DeleteTicketModal } from "./DeleteTicketModal";
import { TicketList } from "./TicketList";
import { StatsBar } from "./StatsBar";
import "./App.css";

const LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;

type ModalState =
  | { type: "create" }
  | { type: "detail"; ticket: Ticket }
  | { type: "edit"; ticket: Ticket }
  | { type: "delete"; ticket: Ticket }
  | null;

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [sort, setSort] = useState<Sort>("created_desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetchTickets({ status: statusFilter, page, limit: LIMIT, search, sort });
      setTickets(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load tickets");
    }
  }, [statusFilter, page, search, sort]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await fetchStats());
    } catch {
      // stats are non-critical; leave last known value
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [loadTickets, loadStats]);

  function handleStatusFilterChange(status: Status | "") {
    setStatusFilter(status);
    setPage(1);
  }

  function handleSortChange(nextSort: Sort) {
    setSort(nextSort);
    setPage(1);
  }

  async function handleTicketStatusChange(id: number, status: Status) {
    const previous = tickets;
    setTickets((current) => current.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateTicket(id, { status });
      loadStats();
    } catch (err) {
      setTickets(previous);
      setError(err instanceof Error ? err.message : "failed to update ticket");
    }
  }

  async function refreshAll() {
    await loadTickets();
    loadStats();
  }

  const totalTickets = stats ? stats.open + stats.in_progress + stats.closed : null;
  const closeModal = () => setModal(null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          <span className="wordmark-mark">MTT</span>
          <span className="wordmark-text">Mini Ticket Tracker</span>
        </div>
        <div className="topbar-right">
          {totalTickets !== null && (
            <span className="topbar-count">
              {totalTickets} ticket{totalTickets === 1 ? "" : "s"} tracked
            </span>
          )}
          <button type="button" className="btn-primary" onClick={() => setModal({ type: "create" })}>
            + New ticket
          </button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <StatsBar stats={stats} />
      <TicketList
        tickets={tickets}
        page={page}
        limit={LIMIT}
        total={total}
        statusFilter={statusFilter}
        sort={sort}
        searchInput={searchInput}
        onStatusFilterChange={handleStatusFilterChange}
        onSortChange={handleSortChange}
        onSearchInputChange={setSearchInput}
        onPageChange={setPage}
        onStatusChange={handleTicketStatusChange}
        onRowClick={(ticket) => setModal({ type: "detail", ticket })}
      />

      {modal?.type === "create" && <CreateTicketModal onClose={closeModal} onCreated={refreshAll} />}

      {modal?.type === "detail" && (
        <TicketDetailModal
          ticket={modal.ticket}
          onClose={closeModal}
          onEdit={() => setModal({ type: "edit", ticket: modal.ticket })}
          onDelete={() => setModal({ type: "delete", ticket: modal.ticket })}
        />
      )}

      {modal?.type === "edit" && <EditTicketModal ticket={modal.ticket} onClose={closeModal} onSaved={refreshAll} />}

      {modal?.type === "delete" && <DeleteTicketModal ticket={modal.ticket} onClose={closeModal} onDeleted={refreshAll} />}
    </div>
  );
}

export default App;
