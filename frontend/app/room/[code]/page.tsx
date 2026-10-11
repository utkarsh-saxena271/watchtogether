"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { apiJoinRoom, ApiError } from "@/src/lib/api";
import { useRoom } from "@/src/hooks/useRoom";
import { JoinGate } from "@/src/components/room/JoinGate";
import { VideoPlayer, type VideoPlayerHandle } from "@/src/components/room/VideoPlayer";
import { VideoInput } from "@/src/components/room/VideoInput";
import { PeoplePanel } from "@/src/components/room/PeoplePanel";
import { ToastContainer } from "@/src/components/ui/Toast";
import { IconCopy, IconCheck } from "@/src/components/ui/Icons";
import type { Role, RoomSyncState } from "@/src/lib/types";

function ConnectionDot({ status }: { status: string }) {
  const isLive = status === "live";
  const label =
    status === "disconnected"
      ? "Disconnected"
      : isLive
        ? "Live"
        : status === "connecting"
          ? "Connecting"
          : "Reconnecting";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isLive ? "var(--accent)" : "var(--muted)",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: "11px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: isLive ? "var(--accent)" : "var(--muted)",
        }}
      >
        {label}
      </span>
    </span>
  );
}

interface RoomUIProps {
  code: string;
  userId: string;
}

function RoomUI({ code, userId }: RoomUIProps) {
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"room" | "people">("room");
  const playerRef = useRef<VideoPlayerHandle | null>(null);

  const handleSyncState = useCallback((s: RoomSyncState) => {
    playerRef.current?.applyState(s);
  }, []);

  const {
    state,
    sendPlay,
    sendPause,
    sendSeek,
    sendChangeVideo,
    sendAssignRole,
    sendRemoveParticipant,
    leaveRoom,
  } =
    useRoom({ code, userId, onSyncState: handleSyncState });

  if (state.isRemoved) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "16px", color: "var(--text)" }}>
          The host removed you from this room.
        </p>
        <Link
          href="/"
          style={{
            fontSize: "14px",
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Go home
        </Link>
      </div>
    );
  }

  const myParticipant = state.participants.find((p) => p.userId === userId);
  const myRole: Role = myParticipant?.role ?? "Participant";
  const canControl = myRole === "Host" || myRole === "Moderator";

  function copyLink() {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const peoplePanel = (
    <PeoplePanel
      participants={state.participants}
      currentUserId={userId}
      currentUserRole={myRole}
      onAssignRole={sendAssignRole}
      onRemove={sendRemoveParticipant}
    />
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "16px",
            letterSpacing: "-0.02em",
            color: "var(--text)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          watchtogether
        </Link>
        <span style={{ color: "var(--line)", fontSize: "18px", userSelect: "none" }}>|</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {code}
          </span>
          <button
            aria-label={copied ? "Link copied" : "Copy room link"}
            onClick={copyLink}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: copied ? "var(--accent)" : "var(--muted)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontFamily: "var(--font-geist-mono)",
              letterSpacing: "0.04em",
              transition: "color 150ms",
            }}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            <span style={{ whiteSpace: "nowrap" }}>{copied ? "Copied" : "Copy link"}</span>
          </button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <ConnectionDot status={state.connectionStatus} />
          <button
            type="button"
            onClick={leaveRoom}
            style={{
              minHeight: "44px",
              padding: "0 8px",
              border: "none",
              background: "transparent",
              color: "var(--muted)",
              font: "inherit",
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Leave room
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <div
          className="room-body"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div className="room-video-col" style={{ flexShrink: 0 }}>
            <VideoPlayer
              ref={playerRef}
              canControl={canControl}
              onPlay={sendPlay}
              onPause={sendPause}
              onSeek={sendSeek}
            />
          </div>

          <div
            className="room-sidebar"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="room-tabs"
              style={{
                display: "flex",
                borderBottom: "1px solid var(--line)",
                flexShrink: 0,
              }}
            >
              {(["room", "people"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  style={{
                    flex: 1,
                    height: "44px",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      mobileTab === tab ? "2px solid var(--text)" : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: mobileTab === tab ? "var(--text)" : "var(--muted)",
                    transition: "color 150ms",
                  }}
                >
                  {tab === "room" ? "Room" : "People"}
                </button>
              ))}
            </div>

            {canControl && (
              <div
                className="room-video-input"
                style={{ flexShrink: 0, display: mobileTab === "room" ? "block" : "none" }}
              >
                <VideoInput onLoad={sendChangeVideo} />
              </div>
            )}

            {!canControl && (
              <div
                className="room-participant-msg"
                style={{
                  display: mobileTab === "room" ? "block" : "none",
                  padding: "24px 16px",
                  flexShrink: 0,
                }}
              >
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                  Only the host and moderators control playback.
                </p>
              </div>
            )}

            <div
              className="room-people"
              style={{
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
                display: mobileTab === "people" ? "flex" : "none",
                flexDirection: "column",
              }}
            >
              {peoplePanel}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={state.toasts} />

      <style>{`
        @media (min-width: 768px) {
          .room-body {
            flex-direction: row !important;
          }
          .room-video-col {
            flex: 1;
            min-width: 0;
            flex-shrink: 1;
            align-self: flex-start;
          }
          .room-sidebar {
            width: 320px !important;
            flex: none !important;
            border-left: 1px solid var(--line);
            height: 100%;
          }
          .room-tabs {
            display: none !important;
          }
          .room-video-input {
            display: block !important;
          }
          .room-participant-msg {
            display: none !important;
          }
          .room-people {
            display: flex !important;
            flex-direction: column !important;
          }
        }
        @supports (padding: max(0px)) {
          .room-sidebar {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}

function RoomPageInner() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  type Phase = "validating" | "not-found" | "gate" | "room";
  const [phase, setPhase] = useState<Phase>("validating");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/room/${code}`);
    }
  }, [authLoading, user, code, router]);

  useEffect(() => {
    if (authLoading || phase !== "validating" || !user) return;
    apiJoinRoom(code)
      .then(() => setPhase("gate"))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setPhase("not-found");
        } else {
          setValidationError(
            err instanceof ApiError ? err.message : "Could not connect to room.",
          );
          setPhase("not-found");
        }
      });
  }, [authLoading, phase, code, user]);

  if (authLoading || phase === "validating") {
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
        Loading room...
      </div>
    );
  }

  if (phase === "not-found") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "16px", color: "var(--text)" }}>
          {validationError || "That room doesn't exist."}
        </p>
        <Link
          href="/"
          style={{
            fontSize: "14px",
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Go home
        </Link>
      </div>
    );
  }

  if (phase === "gate") {
    return <JoinGate roomCode={code} onEnter={() => setPhase("room")} />;
  }

  if (!user) return null;
  return <RoomUI code={code} userId={user.id} />;
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading room...</div>}>
      <RoomPageInner />
    </Suspense>
  );
}
