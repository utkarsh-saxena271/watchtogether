"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface MenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
}

export function Menu({ trigger, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const triggerElement = containerRef.current;
      if (!triggerElement) return;
      const rect = triggerElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        close();
      }
    }
    updatePosition();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: "pointer" }}
      >
        {trigger}
      </div>
      {open && position && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            right: `${position.right}px`,
            top: `${position.top}px`,
            minWidth: "160px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            zIndex: 1000,
            overflow: "hidden",
            fontFamily: "var(--font-geist), system-ui, sans-serif",
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => {
                item.onClick();
                close();
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 14px",
                textAlign: "left",
                fontSize: "13px",
                fontFamily: "inherit",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: item.variant === "danger" ? "var(--danger)" : "var(--text)",
                transition: "background 100ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--line)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
