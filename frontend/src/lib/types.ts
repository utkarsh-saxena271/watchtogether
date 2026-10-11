export type Role = "Host" | "Moderator" | "Participant";

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface ParticipantInfo {
  userId: string;
  username: string;
  role: Role;
}

export type PlayState = "playing" | "paused";

export interface SyncStateData {
  participants: ParticipantInfo[];
  playState: PlayState;
  videoId: string | null;
  currentTime: number;
}

export interface UserJoinedData {
  userId: string;
  username: string;
  role: Role;
  participants: ParticipantInfo[];
}

export interface UserLeftData {
  userId: string;
  username: string;
  participants: ParticipantInfo[];
}

export interface PlaybackEventData {
  playState: PlayState;
  currentTime: number;
  videoId: string | null;
}

export interface RoleAssignedData {
  userId: string;
  username: string;
  role: Role;
  participants: ParticipantInfo[];
}

export interface ParticipantRemovedData {
  userId: string;
  participants: ParticipantInfo[];
}

export type ServerEvent =
  | { event: "sync_state"; data: SyncStateData }
  | { event: "user_joined"; data: UserJoinedData }
  | { event: "user_left"; data: UserLeftData }
  | { event: "play"; data: PlaybackEventData }
  | { event: "pause"; data: PlaybackEventData }
  | { event: "seek"; data: PlaybackEventData }
  | { event: "change_video"; data: PlaybackEventData }
  | { event: "role_assigned"; data: RoleAssignedData }
  | { event: "participant_removed"; data: ParticipantRemovedData }
  | { event: "error"; data: string };

export interface RoomSyncState {
  playState: PlayState;
  videoId: string | null;
  serverTime: number;
  receivedAt: number;
}

export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "removed" | "disconnected";

export interface RoomState {
  participants: ParticipantInfo[];
  syncState: RoomSyncState | null;
  connectionStatus: ConnectionStatus;
  toasts: Toast[];
  isRemoved: boolean;
}

export interface Toast {
  id: string;
  message: string;
}
