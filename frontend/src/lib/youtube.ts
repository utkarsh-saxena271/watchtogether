export function extractYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && isValidYouTubeId(v)) return v;

      const pathMatch = url.pathname.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
      if (pathMatch && isValidYouTubeId(pathMatch[1])) return pathMatch[1];
    }

    if (hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("?")[0];
      if (id && isValidYouTubeId(id)) return id;
    }
  } catch {
  }

  if (isValidYouTubeId(raw)) return raw;

  return null;
}

function isValidYouTubeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

export interface YouTubePlayerInstance {
  loadVideoById(opts: { videoId: string; startSeconds: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YouTubePlayerOptions {
  width: string;
  height: string;
  playerVars: Record<string, number>;
  events: {
    onReady: () => void;
    onStateChange: (event: { data: number }) => void;
    onAutoplayBlocked: () => void;
  };
}

interface YouTubePlayerConstructor {
  new (elementId: string, options: YouTubePlayerOptions): YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: { Player?: YouTubePlayerConstructor };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoadPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (window.YT?.Player) {
      resolve();
      return;
    }

    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existingCallback?.();
      resolve();
    };

    if (!document.getElementById("yt-iframe-api")) {
      const script = document.createElement("script");
      script.id = "yt-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiLoadPromise;
}
