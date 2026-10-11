import type { ServerEvent } from "./types";

type ClientEvent =
  | { event: "join_room"; data: { code: string } }
  | { event: "leave_room"; data?: undefined }
  | { event: "play"; data?: undefined }
  | { event: "pause"; data?: undefined }
  | { event: "seek"; data: { time: number } }
  | { event: "change_video"; data: { videoId: string } }
  | { event: "assign_role"; data: { userId: string; role: "Moderator" | "Participant" } }
  | { event: "remove_participant"; data: { userId: string } };

export function wsSend(ws: WebSocket, msg: ClientEvent): boolean {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

export function parseServerEvent(raw: string): ServerEvent | null {
  try {
    const msg = JSON.parse(raw) as unknown;
    if (
      typeof msg !== "object" ||
      msg === null ||
      !("event" in msg) ||
      typeof (msg as Record<string, unknown>).event !== "string"
    ) {
      return null;
    }

    const { event, data } = msg as { event: string; data: unknown };

    switch (event) {
      case "sync_state":
        if (isSyncStateData(data)) return { event, data };
        break;
      case "user_joined":
        if (isUserJoinedData(data)) return { event, data };
        break;
      case "user_left":
        if (isUserLeftData(data)) return { event, data };
        break;
      case "play":
      case "pause":
      case "seek":
      case "change_video":
        if (isPlaybackEventData(data)) return { event, data };
        break;
      case "role_assigned":
        if (isRoleAssignedData(data)) return { event, data };
        break;
      case "participant_removed":
        if (isParticipantRemovedData(data)) return { event, data };
        break;
      case "error":
        if (typeof data === "string") return { event, data };
        break;
    }
  } catch {
  }
  return null;
}

function isRole(v: unknown): v is "Host" | "Moderator" | "Participant" {
  return v === "Host" || v === "Moderator" || v === "Participant";
}

function isParticipantInfoArray(v: unknown): v is { userId: string; username: string; role: "Host" | "Moderator" | "Participant" }[] {
  return (
    Array.isArray(v) &&
    v.every(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        typeof p.userId === "string" &&
        typeof p.username === "string" &&
        isRole(p.role),
    )
  );
}

function isSyncStateData(d: unknown): d is import("./types").SyncStateData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    isParticipantInfoArray(o.participants) &&
    (o.playState === "playing" || o.playState === "paused") &&
    (o.videoId === null || typeof o.videoId === "string") &&
    typeof o.currentTime === "number"
  );
}

function isUserJoinedData(d: unknown): d is import("./types").UserJoinedData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.userId === "string" &&
    typeof o.username === "string" &&
    isRole(o.role) &&
    isParticipantInfoArray(o.participants)
  );
}

function isUserLeftData(d: unknown): d is import("./types").UserLeftData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.userId === "string" &&
    typeof o.username === "string" &&
    isParticipantInfoArray(o.participants)
  );
}

function isPlaybackEventData(d: unknown): d is import("./types").PlaybackEventData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    (o.playState === "playing" || o.playState === "paused") &&
    typeof o.currentTime === "number" &&
    (o.videoId === null || typeof o.videoId === "string")
  );
}

function isRoleAssignedData(d: unknown): d is import("./types").RoleAssignedData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.userId === "string" &&
    typeof o.username === "string" &&
    isRole(o.role) &&
    isParticipantInfoArray(o.participants)
  );
}

function isParticipantRemovedData(d: unknown): d is import("./types").ParticipantRemovedData {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return typeof o.userId === "string" && isParticipantInfoArray(o.participants);
}
