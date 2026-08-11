import { useState } from "react";
import type { FormEvent } from "react";
import { createTicket } from "./api";
import type { Priority } from "./api";
import { Modal } from "./Modal";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTicketModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createTicket({ title, description: description || undefined, priority });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create ticket");
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="create-ticket-heading">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="panel-eyebrow">New</div>
        <h2 id="create-ticket-heading">Log a ticket</h2>
        <label>
          Title
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's broken?" required />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
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
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
