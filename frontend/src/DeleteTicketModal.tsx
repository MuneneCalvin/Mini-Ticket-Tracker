import { useState } from "react";
import { deleteTicket } from "./api";
import type { Ticket } from "./api";
import { Modal } from "./Modal";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteTicketModal({ ticket, onClose, onDeleted }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setDeleting(true);
    try {
      await deleteTicket(ticket.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to delete ticket");
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="delete-ticket-heading" width="narrow">
      <div className="modal-form">
        <h2 id="delete-ticket-heading">Delete this ticket?</h2>
        <p className="detail-description">
          <span className="mono">#{String(ticket.id).padStart(2, "0")}</span> — {ticket.title}. This can't be undone.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete ticket"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
