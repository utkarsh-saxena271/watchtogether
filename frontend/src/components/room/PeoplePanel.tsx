"use client";

import { useState } from "react";
import type { ParticipantInfo, Role } from "@/src/lib/types";
import { Menu } from "@/src/components/ui/Menu";
import { Button } from "@/src/components/ui/Button";

interface PeoplePanelProps {
  participants: ParticipantInfo[];
  currentUserId: string;
  currentUserRole: Role;
  onAssignRole: (userId: string, role: "Moderator" | "Participant") => void;
  onRemove: (userId: string) => void;
}

export function PeoplePanel({
  participants,
  currentUserId,
  currentUserRole,
  onAssignRole,
  onRemove,
}: PeoplePanelProps) {
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          People ({participants.length})
        </p>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {participants.map((p) => {
          const isMe = p.userId === currentUserId;
          const roleLabel = p.role === "Host" ? "HOST" : p.role === "Moderator" ? "MOD" : null;
          const canManage = currentUserRole === "Host" && !isMe && p.role !== "Host";

          return (
            <div
              key={p.userId}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 16px",
                borderBottom: "1px solid var(--line)",
                gap: "8px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: "14px",
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.username}
                {isMe && (
                  <span style={{ color: "var(--muted)", marginLeft: "6px", fontSize: "12px" }}>
                    (you)
                  </span>
                )}
              </span>

              {roleLabel && (
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    color: "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  {roleLabel}
                </span>
              )}

              {canManage && (
                <>
                  {pendingRemove === p.userId ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Remove?</span>
                      <Button
                        variant="danger"
                        size="sm"
                        style={{ height: "28px", padding: "0 8px", fontSize: "12px" }}
                        onClick={() => {
                          onRemove(p.userId);
                          setPendingRemove(null);
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ height: "28px", padding: "0 8px", fontSize: "12px" }}
                        onClick={() => setPendingRemove(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Menu
                      trigger={
                        <Button variant="ghost" size="sm" style={{ height: "28px", padding: "0 8px", fontSize: "12px" }}>
                          Manage
                        </Button>
                      }
                      items={[
                        p.role === "Participant"
                          ? {
                              label: "Make moderator",
                              onClick: () => onAssignRole(p.userId, "Moderator"),
                            }
                          : {
                              label: "Make participant",
                              onClick: () => onAssignRole(p.userId, "Participant"),
                            },
                        {
                          label: "Remove",
                          variant: "danger",
                          onClick: () => setPendingRemove(p.userId),
                        },
                      ]}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}

        {participants.length === 0 && (
          <p
            style={{
              padding: "24px 16px",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            Nobody here yet.
          </p>
        )}
      </div>
    </div>
  );
}
