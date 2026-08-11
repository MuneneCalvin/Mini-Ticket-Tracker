import type { Ticket } from "./api";
import { Modal } from "./Modal";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<Ticket["status"], string> = { open: "Open", in_progress: "In progress", closed: "Closed" };

export function TicketDetailModal({ ticket, onClose, onEdit, onDelete }: Props) {
  return (
    <Modal onClose={onClose} labelledBy="ticket-detail-heading">
      <div className="modal-form">
        <div className="panel-eyebrow mono">#{String(ticket.id).padStart(2, "0")}</div>
        <h2 id="ticket-detail-heading">{ticket.title}</h2>
        <div className="detail-badges">
          <span className={`badge priority-${ticket.priority}`}>{ticket.priority}</span>
          <span className={`badge status-badge status-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Description</span>
          <p className="detail-description">{ticket.description || "No description provided."}</p>
        </div>
        <div className="detail-field">
          <span className="detail-label">Created</span>
          <p className="mono">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-danger" onClick={onDelete}>
            Delete
          </button>
          <div className="modal-actions-right">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn-primary" onClick={onEdit}>
              Edit
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
