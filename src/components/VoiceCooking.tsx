"use client";

import { useEffect, useRef, useState } from "react";
import ChefHat from "./ChefHat";
import {
  useElevenLabsConversation,
  ConversationStatus,
} from "@/hooks/useElevenLabsConversation";
import { recipe, agentSystemPrompt, agentFirstMessage } from "@/lib/recipe";

/**
 * Full-screen voice cooking interface.
 *
 * Session persistence strategy:
 * 1. "Start Cooking" button ensures connect() runs in a user-gesture
 *    context (required for AudioContext + mic access).
 * 2. The hook's session guard prevents Strict Mode double-mount from
 *    killing the WebSocket.
 * 3. visibilitychange handler prevents the browser from garbage-collecting
 *    the WebSocket when the tab is backgrounded.
 * 4. Session stays alive until the user clicks "End session" or closes
 *    the tab — no automatic teardown.
 */
export default function VoiceCooking() {
  const { status, isSpeaking, transcript, connect, disconnect } =
    useElevenLabsConversation({
      systemPrompt: agentSystemPrompt,
      firstMessage: agentFirstMessage,
    });
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [showRecipe, setShowRecipe] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const isStartingRef = useRef(false);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  /**
   * Prevent the browser from throttling or suspending our WebSocket
   * when the tab is hidden. Some browsers aggressively throttle
   * background tabs, which can cause the WebSocket to close.
   *
   * Web Audio API workaround: create a silent oscillator that keeps
   * the audio thread alive. This is a well-known technique used by
   * real-time audio apps.
   */
  useEffect(() => {
    if (status !== "connected") return;

    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden && !audioCtx) {
        // Tab was hidden — start a silent oscillator to keep audio alive
        try {
          audioCtx = new AudioContext();
          oscillator = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          gain.gain.value = 0; // Silent
          oscillator.connect(gain);
          gain.connect(audioCtx.destination);
          oscillator.start();
        } catch {
          // Best-effort
        }
      } else if (!document.hidden && audioCtx) {
        // Tab is visible again — clean up the keep-alive
        try {
          oscillator?.stop();
          audioCtx.close();
        } catch {
          // Ignore
        }
        audioCtx = null;
        oscillator = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      try {
        oscillator?.stop();
        audioCtx?.close();
      } catch {
        // Ignore
      }
    };
  }, [status]);

  /**
   * Start the voice session on user click. Guarded against double-tap
   * with isStartingRef to prevent overlapping connect() calls.
   */
  const handleStart = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setHasStarted(true);

    try {
      await connect();
    } finally {
      isStartingRef.current = false;
    }
  };

  const statusLabel = getStatusLabel(status);

  return (
    <div className="w-full max-w-lg mx-auto px-6 py-8 flex flex-col items-center min-h-screen">
      {/* Status indicator — only shown after session starts */}
      {hasStarted && (
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
      )}

      {/* Chef Hat — central focus */}
      <div className="flex-shrink-0 my-6">
        <ChefHat isSpeaking={isSpeaking} size={120} />
      </div>

      {/* Pre-connect state: show a start button */}
      {!hasStarted && (
        <div className="flex flex-col items-center gap-4 my-4">
          <p className="font-body text-sm text-white/40 text-center max-w-xs leading-relaxed">
            Your voice cooking assistant is ready. Tap below to begin — the chef
            will greet you and walk through each step.
          </p>
          <button
            onClick={handleStart}
            className="group relative overflow-hidden rounded-xl py-3.5 px-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, #6B2FA0 0%, #8348BC 50%, #6B2FA0 100%)",
              boxShadow:
                "0 4px 16px rgba(107,47,160,0.35), 0 1px 3px rgba(107,47,160,0.2)",
            }}
          >
            <span className="font-body font-medium text-white tracking-wide">
              Start Cooking
            </span>
          </button>
        </div>
      )}

      {/* Listening indicator */}
      {status === "connected" && !isSpeaking && (
        <div className="mb-4 flex items-center gap-2 opacity-60">
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

      {/* Recipe card — collapsible */}
      <div className="w-full mb-4">
        <button
          onClick={() => setShowRecipe((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-plum-light/60"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
            <span className="font-display text-sm text-white/70">
              {recipe.title}
            </span>
            <span className="font-body text-xs text-white/25">
              {recipe.totalTime}
            </span>
          </div>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 text-white/25 transition-transform duration-200 ${
              showRecipe ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {showRecipe && (
          <div className="mt-2 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
            {recipe.steps.map((step, index) => (
              <div
                key={step.number}
                className={`px-4 py-3.5 ${
                  index < recipe.steps.length - 1
                    ? "border-b border-white/[0.04]"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-plum/20 flex items-center justify-center mt-0.5">
                    <span className="font-display text-xs text-plum-light/80">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display text-sm text-white/65">
                        {step.title}
                      </h4>
                      <span className="font-body text-[10px] text-white/20 ml-2 flex-shrink-0">
                        {step.duration}
                      </span>
                    </div>
                    <p className="font-body text-xs text-white/35 leading-relaxed">
                      {step.instruction}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transcript */}
      {hasStarted && (
        <div className="w-full flex-1 overflow-y-auto max-h-[35vh] px-2 scrollbar-hide">
          {transcript.length === 0 && status === "connected" && (
            <p className="text-center font-body text-sm text-white/20 italic mt-4">
              The chef will greet you momentarily…
            </p>
          )}

          {transcript.length === 0 && status === "connecting" && (
            <p className="text-center font-body text-sm text-white/20 italic mt-4">
              Connecting to your cooking assistant…
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
      )}

      {/* Error / disconnect state */}
      {status === "error" && (
        <div className="mt-6 text-center">
          <p className="font-body text-sm text-red-400/80 mb-3">
            Connection failed. Check your microphone permissions and API
            configuration.
          </p>
          <button
            onClick={handleStart}
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
            onClick={handleStart}
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
          className="mt-6 font-body text-xs text-white/15 hover:text-white/30 transition-colors"
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
