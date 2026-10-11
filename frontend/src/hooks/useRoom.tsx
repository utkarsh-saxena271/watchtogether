"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { wsSend, parseServerEvent } from "@/src/lib/ws";
import type {
  RoomState,
  ParticipantInfo,
  RoomSyncState,
  Toast,
  ConnectionStatus,
} from "@/src/lib/types";

type Action =
  | { type: "SET_CONNECTION"; status: ConnectionStatus }
  | { type: "SET_PARTICIPANTS"; participants: ParticipantInfo[] }
  | { type: "SET_SYNC_STATE"; syncState: RoomSyncState }
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "SET_REMOVED" };

function roomReducer(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case "SET_CONNECTION":
      return { ...state, connectionStatus: action.status };
    case "SET_PARTICIPANTS":
      return { ...state, participants: action.participants };
    case "SET_SYNC_STATE":
      return { ...state, syncState: action.syncState };
    case "ADD_TOAST": {
      const toasts = [...state.toasts, action.toast].slice(-3);
      return { ...state, toasts };
    }
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "SET_REMOVED":
      return { ...state, isRemoved: true, connectionStatus: "removed" };
  }
}

const initialState: RoomState = {
  participants: [],
  syncState: null,
  connectionStatus: "connecting",
  toasts: [],
  isRemoved: false,
};

interface UseRoomOptions {
  code: string;
  userId: string;
  onSyncState: (s: RoomSyncState) => void;
}

export function useRoom({ code, userId, onSyncState }: UseRoomOptions) {
  const [state, dispatch] = useReducer(roomReducer, initialState);
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const intentionalClose = useRef(false);
  const connectRef = useRef<() => void>(() => {});
  const onSyncStateRef = useRef(onSyncState);

  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: "ADD_TOAST", toast: { id, message } });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 3000);
  }, []);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3000";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    dispatch({ type: "SET_CONNECTION", status: "connecting" });

    ws.onopen = () => {
      if (wsRef.current !== ws || intentionalClose.current) return;
      wsSend(ws, { event: "join_room", data: { code } });
      syncTimeout.current = setTimeout(() => {
        if (wsRef.current !== ws || intentionalClose.current) return;
        dispatch({ type: "SET_CONNECTION", status: "reconnecting" });
        ws.close();
      }, 5000);
    };

    ws.onmessage = (evt: MessageEvent<string>) => {
      if (wsRef.current !== ws || intentionalClose.current) return;
      const msg = parseServerEvent(evt.data);
      if (!msg) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[useRoom] Unknown/invalid WS message:", evt.data);
        }
        return;
      }

      switch (msg.event) {
        case "sync_state": {
          const { participants, playState, videoId, currentTime } = msg.data;
          const syncState: RoomSyncState = {
            playState,
            videoId,
            serverTime: currentTime,
            receivedAt: performance.now(),
          };
          dispatch({ type: "SET_PARTICIPANTS", participants });
          dispatch({ type: "SET_SYNC_STATE", syncState });
          dispatch({ type: "SET_CONNECTION", status: "live" });
          reconnectAttempts.current = 0;
          if (syncTimeout.current) clearTimeout(syncTimeout.current);
          onSyncStateRef.current(syncState);
          break;
        }
        case "user_joined": {
          dispatch({ type: "SET_PARTICIPANTS", participants: msg.data.participants });
          if (msg.data.userId !== userId) {
            addToast(`${msg.data.username} joined`);
          }
          break;
        }
        case "user_left": {
          dispatch({ type: "SET_PARTICIPANTS", participants: msg.data.participants });
          addToast(`${msg.data.username} left`);
          break;
        }
        case "play":
        case "pause":
        case "seek":
        case "change_video": {
          const { playState, currentTime, videoId } = msg.data;
          const syncState: RoomSyncState = {
            playState,
            videoId,
            serverTime: currentTime,
            receivedAt: performance.now(),
          };
          dispatch({ type: "SET_SYNC_STATE", syncState });
          onSyncStateRef.current(syncState);
          break;
        }
        case "role_assigned": {
          dispatch({ type: "SET_PARTICIPANTS", participants: msg.data.participants });
          if (msg.data.userId === userId) {
            const label = msg.data.role === "Moderator" ? "a moderator" : "a participant";
            addToast(`You are now ${label}`);
          }
          break;
        }
        case "participant_removed": {
          if (msg.data.userId === userId) {
            dispatch({ type: "SET_REMOVED" });
            intentionalClose.current = true;
          } else {
            dispatch({ type: "SET_PARTICIPANTS", participants: msg.data.participants });
          }
          break;
        }
        case "error": {
          addToast(msg.data);
          if (msg.data === "room doesn't exist") {
            dispatch({ type: "SET_CONNECTION", status: "disconnected" });
            intentionalClose.current = true;
            if (syncTimeout.current) clearTimeout(syncTimeout.current);
            ws.close();
          }
          break;
        }
      }
    };

    ws.onclose = (evt) => {
      if (wsRef.current !== ws) return;
      wsRef.current = null;
      if (syncTimeout.current) clearTimeout(syncTimeout.current);

      if (evt.code === 4001) {
        dispatch({ type: "SET_REMOVED" });
        intentionalClose.current = true;
        return;
      }

      if (intentionalClose.current) return;

      const scheduleReconnect = () => {
        if (intentionalClose.current || wsRef.current !== null) return;
        dispatch({ type: "SET_CONNECTION", status: "reconnecting" });
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
        reconnectAttempts.current++;
        reconnectTimer.current = setTimeout(() => connectRef.current(), delay);
      };

      void fetch("/api/auth/me", { credentials: "include" })
        .then((response) => {
          if (intentionalClose.current || wsRef.current !== null) return;
          if (response.status === 401) {
            intentionalClose.current = true;
            const next = `${window.location.pathname}${window.location.search}`;
            router.replace(`/login?next=${encodeURIComponent(next)}`);
            return;
          }
          scheduleReconnect();
        })
        .catch(scheduleReconnect);
    };

    ws.onerror = () => {
    };
  }, [code, userId, addToast, router]);

  useEffect(() => {
    connectRef.current = connect;
    onSyncStateRef.current = onSyncState;
  }, [connect, onSyncState]);

  const send = useCallback(
    (message: Parameters<typeof wsSend>[1]) => {
      const ws = wsRef.current;
      if (!ws || !wsSend(ws, message)) {
        addToast("Room connection is unavailable. Try again when connected.");
      }
    },
    [addToast],
  );

  const leaveRoom = useCallback(() => {
    intentionalClose.current = true;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      wsSend(ws, { event: "leave_room" });
      ws.close(1000, "left room");
    }

    router.push("/");
  }, [router]);

  useEffect(() => {
    intentionalClose.current = false;
    connect();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        try {
          wsSend(ws, { event: "leave_room" });
        } catch {
        }
        ws.close();
      }
    };
  }, [connect]);

  const sendPlay = useCallback(() => {
    send({ event: "play" });
  }, [send]);

  const sendPause = useCallback(() => {
    send({ event: "pause" });
  }, [send]);

  const sendSeek = useCallback((time: number) => {
    send({ event: "seek", data: { time } });
  }, [send]);

  const sendChangeVideo = useCallback((videoId: string) => {
    send({ event: "change_video", data: { videoId } });
  }, [send]);

  const sendAssignRole = useCallback(
    (targetUserId: string, role: "Moderator" | "Participant") => {
      send({ event: "assign_role", data: { userId: targetUserId, role } });
    },
    [send],
  );

  const sendRemoveParticipant = useCallback((targetUserId: string) => {
    send({ event: "remove_participant", data: { userId: targetUserId } });
  }, [send]);

  return {
    state,
    sendPlay,
    sendPause,
    sendSeek,
    sendChangeVideo,
    sendAssignRole,
    sendRemoveParticipant,
    leaveRoom,
    addToast,
  };
}
