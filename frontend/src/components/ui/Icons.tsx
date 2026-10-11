interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean;
}

export function IconPlay({ className, style, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <polygon points="3,1 14,8 3,15" />
    </svg>
  );
}

export function IconPause({ className, style, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <rect x="2" y="2" width="4" height="12" rx="1" />
      <rect x="10" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

export function IconCopy({ className, style, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" />
    </svg>
  );
}

export function IconCheck({ className, style, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <polyline points="2.5,8.5 6.5,12.5 13.5,4" />
    </svg>
  );
}

export function IconClose({ className, style, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  );
}

export function IconChevronRight({ className, style, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <polyline points="6,4 10,8 6,12" />
    </svg>
  );
}
