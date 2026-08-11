export type Status = "open" | "in_progress" | "closed";
export type Priority = "low" | "medium" | "high";

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  createdAt: string;
}

export interface TicketListResponse {
  data: Ticket[];
  page: number;
  limit: number;
  total: number;
}

export type Stats = Record<Status, number>;

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "request failed");
  }
  return res.json() as Promise<T>;
}

export function fetchTickets(params: { status?: Status | ""; page?: number; limit?: number }): Promise<TicketListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  return fetch(`${API_URL}/tickets?${search}`).then((res) => handle<TicketListResponse>(res));
}

export function fetchStats(): Promise<Stats> {
  return fetch(`${API_URL}/tickets/stats`).then((res) => handle<Stats>(res));
}

export function createTicket(input: { title: string; description?: string; priority?: Priority }): Promise<Ticket> {
  return fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => handle<Ticket>(res));
}

export function updateTicket(id: number, input: { status?: Status; priority?: Priority }): Promise<Ticket> {
  return fetch(`${API_URL}/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => handle<Ticket>(res));
}
