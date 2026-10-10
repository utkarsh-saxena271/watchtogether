import type WebSocket from "ws";
import type Room from "./room.js";

export const sessions = new Map<WebSocket, { userId: string, username: string, roomId?: string }>();
export const rooms = new Map<string, Room>()