"use client";

import { useEffect, useRef, useState } from "react";
import ChefHat from "./ChefHat";
import {
  useElevenLabsConversation,
  ConversationStatus,
} from "@/hooks/useElevenLabsConversation";
import { recipe, agentSystemPrompt } from "@/lib/recipe";

/**
 * Full-screen voice cooking interface.
 * Displays the recipe steps, animated chef hat, and live transcript.
 * Injects the full recipe into the ElevenLabs agent prompt via overrides
 * so the voice agent can respond to commands like "read step 2".
 */
export default function VoiceCooking() {
  const { status, isSpeaking, transcript, connect, disconnect } =
    useElevenLabsConversation({ systemPrompt: agentSystemPrompt });
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasConnected = useRef(false);
  const [showRecipe, setShowRecipe] = useState(true);

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
    <div className="w-full max-w-lg mx-auto px-6 py-8 flex flex-col items-center min-h-screen">
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
      <div className="flex-shrink-0 my-6">
        <ChefHat isSpeaking={isSpeaking} size={120} />
      </div>

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
      <div className="w-full flex-1 overflow-y-auto max-h-[35vh] px-2 scrollbar-hide">
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
