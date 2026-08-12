import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { IconX } from "../icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  // Rendered via a portal straight into <body> - a modal nested inside any
  // ancestor with a CSS filter/backdrop-filter/transform (e.g. our glass
  // panels) would otherwise have its `fixed` positioning scoped to that
  // ancestor's box instead of the viewport, per the CSS containing-block spec.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-card relative z-10 w-full max-w-lg p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-white/50 hover:text-slate-600 dark:hover:bg-white/10"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
