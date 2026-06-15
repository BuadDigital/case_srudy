"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import {
  ModalBody,
  ModalCard,
  ModalClose,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@platform/design-system";

export function AppModal({
  open,
  title,
  children,
  footer,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  /** Wider card for two-column forms (PO intake, etc.). */
  wide?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCard wide={wide} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <ModalHeader>
          <ModalTitle id={titleId}>{title}</ModalTitle>
          <ModalClose onClick={onClose} aria-label="إغلاق">
            ×
          </ModalClose>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        {footer ? <ModalFooter>{footer}</ModalFooter> : null}
        </ModalCard>
      </div>
    </ModalOverlay>
  );
}
