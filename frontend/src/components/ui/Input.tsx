import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-mono-ui text-[var(--muted)]"
        style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "h-10 w-full rounded-[4px] border border-[var(--line)] bg-[var(--surface)]",
          "px-3 text-[14px] text-[var(--text)] placeholder:text-[var(--faint)]",
          "transition-colors duration-150",
          "focus-visible:outline-[var(--accent)] focus-visible:border-[var(--accent)]",
          error ? "border-[var(--danger)]" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[12px] text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-[12px] text-[var(--danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
