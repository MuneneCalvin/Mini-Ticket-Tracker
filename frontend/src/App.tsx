import { useCallback, useEffect, useState } from "react";
import { fetchStats, fetchTickets, updateTicket } from "./api";
import type { Sort, Stats, Status, Ticket } from "./api";
import { TicketForm } from "./TicketForm";
import { TicketList } from "./TicketList";
import { StatsBar } from "./StatsBar";
import "./App.css";

const LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;

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
  }, [loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats, tickets]);

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
    } catch (err) {
      setTickets(previous);
      setError(err instanceof Error ? err.message : "failed to update ticket");
    }
  }

  return (
    <div className="app">
      <h1>Mini Ticket Tracker</h1>
      {error && <p className="error">{error}</p>}
      <StatsBar stats={stats} />
      <div className="layout">
        <TicketForm onCreated={loadTickets} />
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
        />
      </div>
    </div>
  );
}

export default App;
