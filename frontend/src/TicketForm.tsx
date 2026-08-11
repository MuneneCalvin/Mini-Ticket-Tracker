import { useState } from "react";
import type { FormEvent } from "react";
import { createTicket } from "./api";
import type { Priority } from "./api";

interface Props {
  onCreated: () => void;
}

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setJustCreated(false);
    setSubmitting(true);
    try {
      await createTicket({ title, description: description || undefined, priority });
      setTitle("");
      setDescription("");
      setPriority("medium");
      onCreated();
      setJustCreated(true);
      setTimeout(() => setJustCreated(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ticket-form">
      <div className="panel-eyebrow">New</div>
      <h2>Log a ticket</h2>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's broken?" required />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add detail an agent will need (optional)"
        />
      </label>
      <label>
        Priority
        <select className="select-control" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Creating…" : "Create ticket"}
      </button>
      {error && <p className="error">{error}</p>}
      {justCreated && <p className="success">Ticket created.</p>}
    </form>
  );
}
