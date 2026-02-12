"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: "✓",
  info: "i",
  warning: "!",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutMapRef = useRef(new Map());

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutMapRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((toastId) => {
    const timeout = timeoutMapRef.current.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMapRef.current.delete(toastId);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const dismissToast = useCallback(
    (toastId) => {
      const timeout = timeoutMapRef.current.get(toastId);
      if (timeout) {
        clearTimeout(timeout);
        timeoutMapRef.current.delete(toastId);
      }

      setToasts((prev) => prev.map((toast) => (toast.id === toastId ? { ...toast, closing: true } : toast)));
      window.setTimeout(() => removeToast(toastId), 190);
    },
    [removeToast],
  );

  const showToast = useCallback(
    ({ type = "info", title, message }) => {
      const toastId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const toast = {
        id: toastId,
        type,
        title,
        message,
        closing: false,
      };

      setToasts((prev) => {
        const next = [...prev, toast];
        if (next.length <= 6) {
          return next;
        }

        const oldest = next[0];
        const oldTimeout = timeoutMapRef.current.get(oldest.id);
        if (oldTimeout) {
          clearTimeout(oldTimeout);
          timeoutMapRef.current.delete(oldest.id);
        }

        return next.slice(1);
      });

      const timeout = window.setTimeout(() => dismissToast(toastId), 3200);
      timeoutMapRef.current.set(toastId, timeout);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {[...toasts].reverse().map((toast, index) => (
          <article
            key={toast.id}
            className={`toast toast-${toast.type} ${toast.closing ? "is-closing" : ""}`}
            style={{
              "--toast-index": index,
              zIndex: 30 - index,
            }}
          >
            <span className="toast-icon" aria-hidden>
              {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
            </span>
            <div className="toast-content">
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label="Fechar aviso">
              ×
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa ser usado dentro de ToastProvider.");
  }

  return context;
}
