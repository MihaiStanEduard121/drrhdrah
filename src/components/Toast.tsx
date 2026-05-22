import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: "bg-slate-900/95 border-emerald-500/30 text-emerald-400",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
      accent: "bg-emerald-500"
    },
    error: {
      bg: "bg-slate-900/95 border-rose-500/30 text-rose-400",
      icon: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
      accent: "bg-rose-500"
    },
    info: {
      bg: "bg-slate-900/95 border-sky-500/30 text-sky-400",
      icon: <AlertCircle className="h-5 w-5 text-sky-400 shrink-0" />,
      accent: "bg-sky-500"
    }
  };

  const current = typeConfig[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-fade-in-up">
      <div className={`flex items-center gap-3.5 p-4 rounded-xl border shadow-2xl backdrop-blur-md relative overflow-hidden ${current.bg}`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${current.accent}`}></div>
        
        {/* Status Icon */}
        <div className="pl-1.5">
          {current.icon}
        </div>

        {/* Text */}
        <p className="text-sm font-medium pr-6 leading-relaxed text-slate-200">
          {toast.text}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Auto progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div className={`h-full animate-shrink-width ${current.accent}`} style={{ animationDuration: "4500ms", animationTimingFunction: "linear" }}></div>
        </div>
      </div>
    </div>
  );
}
