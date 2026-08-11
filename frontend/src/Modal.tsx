import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface Props {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  width?: "narrow" | "wide";
}

export function Modal({ onClose, labelledBy, children, width = "narrow" }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal-panel modal-panel-${width}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panelRef}
      >
        {children}
      </div>
    </div>
  );
}
