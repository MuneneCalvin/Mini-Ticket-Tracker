import { useState } from "react";
import type { FormEvent } from "react";
import { updateTicket } from "./api";
import type { Priority, Status, Ticket } from "./api";
import { Modal } from "./Modal";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: Status[] = ["open", "in_progress", "closed"];
const STATUS_LABELS: Record<Status, string> = { open: "Open", in_progress: "In progress", closed: "Closed" };

export function EditTicketModal({ ticket, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? "");
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [status, setStatus] = useState<Status>(ticket.status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateTicket(ticket.id, { title, description: description || undefined, priority, status });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to save ticket");
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="edit-ticket-heading">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="panel-eyebrow mono">Editing #{String(ticket.id).padStart(2, "0")}</div>
        <h2 id="edit-ticket-heading">Edit ticket</h2>
        <label>
          Title
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </label>
        <div className="modal-form-row">
          <label>
            Priority
            <select className="select-control" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Status
            <select className="select-control" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
