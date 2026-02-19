import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@11labs/client";

export type ConversationStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type AgentMode = "listening" | "speaking";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
  timestamp: number;
}

interface UseElevenLabsConversationReturn {
  status: ConversationStatus;
  agentMode: AgentMode;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Hook that wraps the ElevenLabs Conversational AI client.
 *
 * Uses the signed URL approach so the API key never leaves the server.
 * The ElevenLabs client handles:
 *  - WebSocket connection for bidirectional audio streaming
 *  - Microphone capture and voice activity detection
 *  - Audio playback with chunked streaming (minimizes inter-sentence gaps)
 *  - Turn-taking (interrupt support for natural conversation)
 */
export function useElevenLabsConversation(): UseElevenLabsConversationReturn {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [agentMode, setAgentMode] = useState<AgentMode>("listening");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const conversationRef = useRef<Conversation | null>(null);

  const isSpeaking = agentMode === "speaking";

  /**
   * Fetch a signed URL from our API route, then start the conversation.
   */
  const connect = useCallback(async () => {
    if (conversationRef.current) return;

    setStatus("connecting");
    setTranscript([]);

    try {
      // 1. Request microphone permission early for smoother UX
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Fetch signed URL from server
      const res = await fetch("/api/signed-url");
      if (!res.ok) throw new Error("Failed to get signed URL");
      const { signedUrl } = await res.json();

      // 3. Start the ElevenLabs conversation session
      const conversation = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setStatus("connected");
        },
        onDisconnect: () => {
          setStatus("disconnected");
          conversationRef.current = null;
        },
        onError: (error: unknown) => {
          console.error("ElevenLabs conversation error:", error);
          setStatus("error");
        },
        onModeChange: (mode: { mode: "listening" | "speaking" }) => {
          setAgentMode(mode.mode);
        },
        onMessage: (message: { source: string; message: string }) => {
          // Capture transcript entries from both agent and user
          const role = message.source === "ai" ? "agent" : "user";
          setTranscript((prev) => [
            ...prev,
            { role, text: message.message, timestamp: Date.now() },
          ]);
        },
      });

      conversationRef.current = conversation;
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("error");
    }
  }, []);

  /**
   * Cleanly end the conversation session.
   */
  const disconnect = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setStatus("disconnected");
    setAgentMode("listening");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
        conversationRef.current = null;
      }
    };
  }, []);

  return {
    status,
    agentMode,
    isSpeaking,
    transcript,
    connect,
    disconnect,
  };
}
