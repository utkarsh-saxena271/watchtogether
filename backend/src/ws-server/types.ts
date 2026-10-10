import type WebSocket from "ws";

export type RoomEvents =
    | "user_joined"
    | "user_left"
    | "sync_state"
    | "play"
    | "pause"
    | "seek"
    | "change_video"
    | "role_assigned"
    | "participant_removed";



export interface Participant {
    userId: string,
    username: string,
    role: 'Host' | 'Moderator' | 'Participant',
    socket: WebSocket
}