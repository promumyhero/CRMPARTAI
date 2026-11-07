"use client";

import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Hapus Data",
  cancelLabel = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={() => !isLoading && onClose()}
      className="fixed inset-0 z-9995 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 overscroll-contain"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                variant === "danger"
                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100"
              }`}
            >
              {variant === "danger" ? (
                <Trash2 className="w-6 h-6" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 id={titleId} className="text-base font-bold text-slate-900 leading-tight">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  aria-label="Tutup dialog"
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p id={descId} className="text-xs text-slate-500 mt-2 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer flex items-center gap-2 ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 focus-visible:ring-rose-500"
                : "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 focus-visible:ring-amber-500"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Memproses…</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
