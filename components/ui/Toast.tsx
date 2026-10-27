"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { Trash2, X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastContextValue {
  showToast: (
    title: string,
    description?: string,
    type?: ToastType,
    action?: ToastAction
  ) => void;
  showDeleteToast: (itemName: string, onUndo?: () => void) => void;
  toast: typeof toast;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showDeleteToast: () => {},
  toast,
});

export const useToast = () => useContext(ToastContext);
export { toast };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback(
    (
      title: string,
      description?: string,
      type: ToastType = "success",
      action?: ToastAction
    ) => {
      // HeroUI / shadcn style custom notification card
      toast.custom((t) => {
        const typeConfig = {
          success: {
            icon: CheckCircle2,
            iconClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
            border: "border-emerald-200/60",
          },
          error: {
            icon: AlertCircle,
            iconClass: "text-rose-600 bg-rose-50 border-rose-100",
            border: "border-rose-200/60",
          },
          warning: {
            icon: AlertTriangle,
            iconClass: "text-amber-600 bg-amber-50 border-amber-100",
            border: "border-amber-200/60",
          },
          info: {
            icon: Info,
            iconClass: "text-blue-600 bg-blue-50 border-blue-100",
            border: "border-blue-200/60",
          },
        }[type];

        const IconComponent = typeConfig.icon;

        return (
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-xl shadow-lg shadow-slate-900/5 border border-slate-200/90 p-3.5 flex items-start gap-3 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${typeConfig.iconClass}`}
            >
              <IconComponent className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {title}
              </h4>
              {description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {description}
                </p>
              )}
              {action && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      action.onClick();
                      toast.dismiss(t);
                    }}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-md transition"
                  >
                    {action.label}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => toast.dismiss(t)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md hover:bg-slate-100 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }, { duration: 4000 });
    },
    []
  );

  // Dedicated HeroUI / shadcn aesthetic delete confirmation toast
  const showDeleteToast = useCallback(
    (itemName: string, onUndo?: () => void) => {
      toast.custom((t) => (
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-xl shadow-xl shadow-rose-950/10 border border-rose-200 p-3.5 flex items-start gap-3 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Dihapus
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {itemName}
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Item berhasil dihapus dari sistem.
            </p>
            {onUndo && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    onUndo();
                    toast.dismiss(t);
                  }}
                  className="text-xs font-bold px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition shadow-2xs"
                >
                  Urungkan Hapus
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => toast.dismiss(t)}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md hover:bg-slate-100 transition"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ), { duration: 4500 });
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, showDeleteToast, toast }}>
      {children}
      <Toaster
        position="top-right"
        closeButton={false}
        expand={false}
        gap={8}
      />
    </ToastContext.Provider>
  );
}
