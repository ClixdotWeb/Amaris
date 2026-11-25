"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "warning";
type Toast = { id: number; tone: ToastTone; message: string };

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

/** toast("Saved") — shows a short message in the corner. */
export const useToast = () => useContext(ToastContext);

const TONE: Record<ToastTone, { bar: string; icon: typeof CheckCircle2; iconClass: string }> = {
  success: { bar: "bg-success", icon: CheckCircle2, iconClass: "text-success" },
  error: { bar: "bg-sale", icon: XCircle, iconClass: "text-sale" },
  warning: { bar: "bg-warning", icon: AlertTriangle, iconClass: "text-warning" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = next.current++;
      setToasts((t) => [...t.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === "error" ? 8000 : 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
        {toasts.map((t) => {
          const { bar, icon: Icon, iconClass } = TONE[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-ui border border-sand bg-white py-3 pr-10 pl-5 text-sm shadow-pop animate-fade-up"
            >
              <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${bar}`} />
              <Icon size={18} strokeWidth={1.5} className={`mt-px shrink-0 ${iconClass}`} aria-hidden />
              <p>{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} className="absolute top-2.5 right-2.5 p-1 text-muted hover:text-ink" aria-label="Dismiss">
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Shows a toast when a form action's state changes ({ ok } → success, { error } → error). */
export function useActionToast(state: { ok?: boolean | string; error?: string } | undefined) {
  const toast = useToast();
  useEffect(() => {
    if (!state) return;
    if (state.error) toast(state.error, "error");
    else if (state.ok) toast(typeof state.ok === "string" ? state.ok : "Saved.");
  }, [state, toast]);
}

/**
 * Shows a toast for a ?flash= message left by a redirect (e.g. after creating a product), then removes it from the URL.
 */
export function FlashToast({ messages }: { messages: Record<string, string> }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const key = params.get("flash");
  useEffect(() => {
    if (!key || !messages[key]) return;
    toast(messages[key]);
    const rest = new URLSearchParams(params);
    rest.delete("flash");
    router.replace(rest.size ? `${path}?${rest}` : path, { scroll: false });
  }, [key, messages, params, path, router, toast]);
  return null;
}
