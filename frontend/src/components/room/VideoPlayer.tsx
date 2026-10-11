"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { loadYouTubeApi, type YouTubePlayerInstance } from "@/src/lib/youtube";
import type { RoomSyncState } from "@/src/lib/types";
import { IconPlay, IconPause } from "@/src/components/ui/Icons";
import { Button } from "@/src/components/ui/Button";

const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

export interface VideoPlayerHandle {
  applyState(state: RoomSyncState): void;
}

interface VideoPlayerProps {
  canControl: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ canControl, onPlay, onPause, onSeek }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayerInstance | null>(null);
    const playerReadyRef = useRef(false);
    const pendingStateRef = useRef<RoomSyncState | null>(null);
    const loadedVideoIdRef = useRef<string | null>(null);
    const autoplayCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRemoteUpdateRef = useRef(false);
    const lastSyncRef = useRef<RoomSyncState | null>(null);

    const [playState, setPlayState] = useState<RoomSyncState["playState"]>("paused");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [hasPendingSeek, setHasPendingSeek] = useState(false);
    const [dragValue, setDragValue] = useState(0);
    const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);

    function expectedPosition(state: RoomSyncState): number {
      if (state.playState === "playing") {
        return state.serverTime + (performance.now() - state.receivedAt) / 1000;
      }
      return state.serverTime;
    }

    const requestPlayback = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;

      player.playVideo();
      if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
      autoplayCheckTimerRef.current = setTimeout(() => {
        if (
          lastSyncRef.current?.playState === "playing" &&
          playerRef.current?.getPlayerState() !== YT_PLAYER_STATE.PLAYING
        ) {
          setShowAutoplayPrompt(true);
        }
      }, 1000);
    }, []);

    const applyState = useCallback((state: RoomSyncState) => {
      lastSyncRef.current = state;
      setPlayState(state.playState);
      setHasPendingSeek(false);

      if (!playerReadyRef.current || !playerRef.current) {
        pendingStateRef.current = state;
        return;
      }

      const player = playerRef.current;
      const expected = expectedPosition(state);

      isRemoteUpdateRef.current = true;
      try {
        if (state.videoId && state.videoId !== loadedVideoIdRef.current) {
          if (state.playState === "playing") {
            player.loadVideoById({ videoId: state.videoId, startSeconds: expected });
          } else {
            player.cueVideoById({ videoId: state.videoId, startSeconds: expected });
          }
          loadedVideoIdRef.current = state.videoId;
          setHasVideo(true);
        } else {
          const playerTime = player.getCurrentTime();
          if (Math.abs(playerTime - expected) > 1.0) {
            player.seekTo(expected, true);
          }
        }

        if (state.playState === "playing") {
          requestPlayback();
          setShowAutoplayPrompt(false);
        } else {
          if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
          player.pauseVideo();
        }
        if (!state.videoId) {
          loadedVideoIdRef.current = null;
          setHasVideo(false);
        }
      } finally {
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 0);
      }

      if (state.videoId) setHasVideo(true);
    }, [requestPlayback]);

    useImperativeHandle(ref, () => ({ applyState }), [applyState]);

    useEffect(() => {
      let destroyed = false;

      loadYouTubeApi().then(() => {
        if (destroyed || !containerRef.current) return;
        const PlayerConstructor = window.YT?.Player;
        if (!PlayerConstructor) {
          throw new Error("YouTube IFrame API loaded without a Player constructor.");
        }

        const iframe = document.createElement("div");
        iframe.id = "yt-player-" + Math.random().toString(36).slice(2);
        containerRef.current.appendChild(iframe);

        const player = new PlayerConstructor(iframe.id, {
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              playerReadyRef.current = true;
              playerRef.current = player;
              const pendingState = pendingStateRef.current;
              pendingStateRef.current = null;
              if (pendingState) {
                applyState(pendingState);
              }
            },
            onStateChange: (evt: { data: number }) => {
              if (isRemoteUpdateRef.current) return;

              if (evt.data === YT_PLAYER_STATE.PLAYING) {
                if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
                setShowAutoplayPrompt(false);
              }
            },
            onAutoplayBlocked: () => setShowAutoplayPrompt(true),
          },
        });
      });

      return () => {
        destroyed = true;
        playerReadyRef.current = false;
        if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [applyState]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (document.hidden) return;
        const player = playerRef.current;
        if (!player) return;
        setCurrentTime(player.getCurrentTime());
        setDuration(player.getDuration());
      }, 250);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      const interval = setInterval(() => {
        const state = lastSyncRef.current;
        const player = playerRef.current;
        if (!state || !player || state.playState !== "playing") return;
        const expected = expectedPosition(state);
        const actual = player.getCurrentTime();
        if (Math.abs(actual - expected) > 1.5) {
          isRemoteUpdateRef.current = true;
          player.seekTo(expected, true);
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 0);
        }
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    function fmt(secs: number): string {
      if (!Number.isFinite(secs) || secs < 0) return "0:00";
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s.toString().padStart(2, "0")}`;
    }

    const displayTime = isDragging || hasPendingSeek ? dragValue : currentTime;

    function finishSeek(value: number) {
      if (!canControl || !isDragging) return;
      setDragValue(value);
      setIsDragging(false);
      setHasPendingSeek(true);
      onSeek(value);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <div style={{ position: "relative", paddingTop: "56.25%", background: "var(--surface)" }}>
        <div
            ref={containerRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              background: "transparent",
            }}
          />

          {!hasVideo && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: "14px",
              }}
            >
              No video yet. Paste a YouTube link to start.
            </div>
          )}

          {showAutoplayPrompt && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Button
                variant="primary"
                onClick={() => {
                  requestPlayback();
                  setShowAutoplayPrompt(false);
                }}
              >
                Tap to start playback
              </Button>
            </div>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "var(--surface)",
          }}
        >
          <button
            aria-label={playState === "playing" ? "Pause" : "Play"}
            disabled={!canControl}
            onClick={() => {
              if (playState === "playing") {
                onPause();
              } else {
                onPlay();
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: canControl ? "var(--text)" : "var(--faint)",
              cursor: canControl ? "pointer" : "not-allowed",
              padding: "8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "44px",
              minHeight: "44px",
              flexShrink: 0,
              transition: "color 150ms",
            }}
          >
            {playState === "playing" ? <IconPause /> : <IconPlay />}
          </button>

          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "11px",
              color: "var(--muted)",
              letterSpacing: "0.04em",
              flexShrink: 0,
              minWidth: "40px",
            }}
          >
            {fmt(displayTime)}
          </span>

          <input
            type="range"
            aria-label="Seek"
            min={0}
            max={duration > 0 ? duration : 100}
            step={1}
            value={isDragging || hasPendingSeek ? dragValue : Math.floor(displayTime)}
            disabled={!canControl}
            onChange={(e) => {
              if (!canControl) return;
              setIsDragging(true);
              setDragValue(Number(e.target.value));
            }}
            onPointerUp={(e) => finishSeek(Number(e.currentTarget.value))}
            onPointerCancel={(e) => finishSeek(Number(e.currentTarget.value))}
            onKeyUp={(e) => finishSeek(Number(e.currentTarget.value))}
            style={{
              flex: 1,
              accentColor: "var(--accent)",
            }}
          />

          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "11px",
              color: "var(--muted)",
              letterSpacing: "0.04em",
              flexShrink: 0,
              minWidth: "40px",
              textAlign: "right",
            }}
          >
            {fmt(duration)}
          </span>
        </div>

        {!canControl && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              padding: "8px 16px",
              margin: 0,
              background: "var(--surface)",
            }}
          >
            Only the host and moderators control playback.
          </p>
        )}
      </div>
    );
  },
);
