"use client";

import { useState } from "react";
import { extractYouTubeId } from "@/src/lib/youtube";
import { Button } from "@/src/components/ui/Button";

interface VideoInputProps {
  onLoad: (videoId: string) => void;
}

export function VideoInput({ onLoad }: VideoInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleLoad() {
    const id = extractYouTubeId(value);
    if (!id) {
      setError("Paste a valid YouTube link or video ID.");
      return;
    }
    setError("");
    setValue("");
    onLoad(id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleLoad();
  }

  return (
    <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
      <p
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-geist-mono)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "8px",
        }}
      >
        Change video
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          id="video-url-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a YouTube link"
          aria-label="YouTube video URL or ID"
          style={{
            flex: 1,
            height: "36px",
            padding: "0 10px",
            fontSize: "13px",
            background: "var(--bg)",
            border: error ? "1px solid var(--danger)" : "1px solid var(--line)",
            borderRadius: "4px",
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <Button variant="secondary" size="sm" onClick={handleLoad}>
          Load
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          style={{ fontSize: "12px", color: "var(--danger)", marginTop: "6px" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
