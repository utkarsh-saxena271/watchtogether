"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { apiCreateRoom, apiJoinRoom, ApiError } from "@/src/lib/api";
import { Button } from "@/src/components/ui/Button";

function normalizeCode(input: string): string {
  const trimmed = input.trim().toUpperCase();
  const match = trimmed.match(/\/ROOM\/([A-Z0-9]{6})(?:[/?#]|$)/);
  if (match) return match[1];
  return trimmed;
}

const VALID_CODE = /^[A-Z0-9]{6}$/;

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createError, setCreateError] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) return null;

  async function handleCreate() {
    setCreating(true);
    setCreateError("");
    try {
      const res = await apiCreateRoom();
      router.push(`/room/${res.data.roomCode}`);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Could not create room.");
      setCreating(false);
    }
  }

  async function handleJoin() {
    const normalized = normalizeCode(code);
    if (!VALID_CODE.test(normalized)) {
      setJoinError("Enter a 6-character room code.");
      return;
    }
    setJoining(true);
    setJoinError("");
    try {
      await apiJoinRoom(normalized);
      router.push(`/room/${normalized}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setJoinError("That room doesn't exist.");
      } else {
        setJoinError(err instanceof ApiError ? err.message : "Could not join room.");
      }
      setJoining(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 0",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "20px",
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          watchtogether
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>{user.username}</span>
          <button
            onClick={() => logout().then(() => router.push("/login"))}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--muted)",
              padding: "4px",
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--muted)")}
          >
            Log out
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "72px 0" }}>
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            color: "var(--text)",
            marginBottom: "16px",
            maxWidth: "640px",
          }}
        >
          Watch the same thing,{" "}
          <em style={{ fontStyle: "italic" }}>at the same time.</em>
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--muted)",
            marginBottom: "72px",
            maxWidth: "60ch",
          }}
        >
          Make a room, share the code, press play together.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "0",
          }}
          className="actions-grid"
        >
          <div style={{ paddingBottom: "40px" }}>
            <h2
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "16px",
              }}
            >
              New room
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "20px", maxWidth: "40ch" }}>
              Start a room and invite people with the code.
            </p>
            <Button
              id="create-room-btn"
              variant="primary"
              onClick={handleCreate}
              disabled={creating}
              style={{ minWidth: "160px" }}
            >
              {creating ? "Creating..." : "Create a room"}
            </Button>
            {createError && (
              <p role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "10px" }}>
                {createError}
              </p>
            )}
          </div>

          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: "40px",
            }}
          >
            <h2
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "16px",
              }}
            >
              Join a room
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "20px", maxWidth: "40ch" }}>
              Got a code? Paste it below or drop a full room link.
            </p>
            <div style={{ display: "flex", gap: "8px", maxWidth: "320px" }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="room-code-input" className="sr-only">
                  Room code
                </label>
                <input
                  id="room-code-input"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (joinError) setJoinError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="ABCDEF"
                  maxLength={64}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "14px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: "var(--surface)",
                    border: joinError ? "1px solid var(--danger)" : "1px solid var(--line)",
                    borderRadius: "4px",
                    color: "var(--text)",
                    outline: "none",
                    transition: "border-color 150ms",
                  }}
                  onFocus={(e) => {
                    if (!joinError) (e.target as HTMLInputElement).style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    if (!joinError) (e.target as HTMLInputElement).style.borderColor = "var(--line)";
                  }}
                />
              </div>
              <Button
                id="join-room-btn"
                variant="secondary"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? "Joining..." : "Join"}
              </Button>
            </div>
            {joinError && (
              <p role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "8px" }}>
                {joinError}
              </p>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .actions-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 0 !important;
          }
          .actions-grid > div:first-child {
            padding-right: 48px;
            padding-bottom: 0 !important;
            border-right: 1px solid var(--line);
          }
          .actions-grid > div:last-child {
            padding-left: 48px;
            border-top: none !important;
            padding-top: 0 !important;
          }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
