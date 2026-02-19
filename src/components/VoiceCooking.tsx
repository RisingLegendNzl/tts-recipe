"use client";

import { useEffect, useRef } from "react";
import ChefHat from "./ChefHat";
import {
  useElevenLabsConversation,
  ConversationStatus,
} from "@/hooks/useElevenLabsConversation";

/**
 * Full-screen voice cooking interface.
 * Auto-connects on mount. Displays the animated chef hat and
 * a live transcript of the conversation.
 */
export default function VoiceCooking() {
  const { status, isSpeaking, transcript, connect, disconnect } =
    useElevenLabsConversation();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasConnected = useRef(false);

  // Auto-connect when component mounts
  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true;
      connect();
    }
  }, [connect]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const statusLabel = getStatusLabel(status);

  return (
    <div className="w-full max-w-md mx-auto px-6 py-12 flex flex-col items-center min-h-screen">
      {/* Status indicator */}
      <div className="mb-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm">
          <div
            className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`}
          />
          <span className="font-body text-xs text-white/40 tracking-wider uppercase">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Chef Hat — central focus */}
      <div className="flex-shrink-0 my-10">
        <ChefHat isSpeaking={isSpeaking} size={140} />
      </div>

      {/* Listening indicator */}
      {status === "connected" && !isSpeaking && (
        <div className="mb-6 flex items-center gap-2 opacity-60">
          <div className="flex gap-1">
            <div
              className="w-1 h-3 bg-plum-light rounded-full animate-pulse"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-1 h-4 bg-plum-light rounded-full animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-1 h-2.5 bg-plum-light rounded-full animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="font-body text-xs text-white/30">Listening…</span>
        </div>
      )}

      {/* Transcript */}
      <div className="w-full flex-1 overflow-y-auto max-h-[45vh] px-2 scrollbar-hide">
        {transcript.length === 0 && status === "connected" && (
          <p className="text-center font-body text-sm text-white/20 italic mt-4">
            The chef will greet you momentarily…
          </p>
        )}

        <div className="space-y-3">
          {transcript.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              className={`transcript-line flex ${
                entry.role === "agent" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl font-body text-sm leading-relaxed ${
                  entry.role === "agent"
                    ? "bg-white/8 text-white/80 rounded-bl-md"
                    : "bg-plum/30 text-white/65 rounded-br-md"
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Error / disconnect state */}
      {status === "error" && (
        <div className="mt-6 text-center">
          <p className="font-body text-sm text-red-400/80 mb-3">
            Connection failed. Check your microphone permissions and API
            configuration.
          </p>
          <button
            onClick={connect}
            className="font-body text-sm text-plum-light/80 underline underline-offset-2 hover:text-plum-light transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {status === "disconnected" && transcript.length > 0 && (
        <div className="mt-6 text-center">
          <p className="font-body text-sm text-white/30 mb-3">
            Session ended. Enjoy your meal!
          </p>
          <button
            onClick={connect}
            className="font-body text-sm text-plum-light/60 underline underline-offset-2 hover:text-plum-light transition-colors"
          >
            Start over
          </button>
        </div>
      )}

      {/* End session (subtle, bottom) */}
      {status === "connected" && (
        <button
          onClick={disconnect}
          className="mt-8 font-body text-xs text-white/15 hover:text-white/30 transition-colors"
        >
          End session
        </button>
      )}
    </div>
  );
}

function getStatusLabel(status: ConversationStatus): string {
  switch (status) {
    case "idle":
      return "Initializing";
    case "connecting":
      return "Connecting";
    case "connected":
      return "Live";
    case "disconnected":
      return "Ended";
    case "error":
      return "Error";
  }
}

function getStatusDotColor(status: ConversationStatus): string {
  switch (status) {
    case "connected":
      return "bg-emerald-400 animate-pulse";
    case "connecting":
      return "bg-amber-400 animate-pulse";
    case "error":
      return "bg-red-400";
    default:
      return "bg-white/30";
  }
}
