"use client";

import { Button } from "@/src/components/ui/Button";

interface JoinGateProps {
  roomCode: string;
  onEnter: () => void;
}

export function JoinGate({ roomCode, onEnter }: JoinGateProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        gap: "40px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--muted)",
            fontFamily: "var(--font-geist-mono)",
            marginBottom: "16px",
          }}
        >
          Room code
        </p>
        <p
          style={{
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          {roomCode}
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onEnter} style={{ minWidth: "160px" }}>
        Enter room
      </Button>
    </div>
  );
}
