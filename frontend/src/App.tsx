import { useCallback, useEffect, useState } from "react";
import { fetchStats, fetchTickets } from "./api";
import type { Stats, Status, Ticket } from "./api";
import { TicketForm } from "./TicketForm";
import { TicketList } from "./TicketList";
import { StatsBar } from "./StatsBar";
import "./App.css";

const LIMIT = 10;

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetchTickets({ status: statusFilter, page, limit: LIMIT });
      setTickets(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load tickets");
    }
  }, [statusFilter, page]);

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
          onStatusFilterChange={handleStatusFilterChange}
          onPageChange={setPage}
          onChanged={loadTickets}
        />
      </div>
    </div>
  );
}

export default App;
