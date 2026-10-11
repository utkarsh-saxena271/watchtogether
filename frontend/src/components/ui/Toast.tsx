"use client";

import type { Toast } from "@/src/lib/types";

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "320px" }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  return (
    <div
      role="status"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontSize: "13px",
        color: "var(--text)",
        opacity: 1,
        transform: "translateY(0)",
        transition: "opacity 150ms, transform 150ms",
      }}
    >
      {toast.message}
    </div>
  );
}
