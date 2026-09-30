"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div className="modalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><button className="iconButton modalClose" onClick={onClose} aria-label="Close"><X size={19} /></button><h2>{title}</h2>{subtitle ? <p className="modalSubtitle">{subtitle}</p> : null}{children}</section></div>;
}
