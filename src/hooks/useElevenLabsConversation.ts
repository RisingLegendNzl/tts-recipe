import { useCallback, useState } from "react";
import { useConversation } from "@elevenlabs/react";

export type ConversationStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
  timestamp: number;
}

interface UseElevenLabsConversationReturn {
  status: ConversationStatus;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Hook that wraps the official @elevenlabs/react useConversation hook
 * with app-specific transcript tracking and status management.
 *
 * Uses the signed URL approach so the API key never leaves the server.
 * The @elevenlabs/react SDK handles:
 *  - WebSocket/WebRTC connection for bidirectional audio streaming
 *  - Microphone capture and voice activity detection
 *  - Audio playback with chunked streaming (minimizes inter-sentence gaps)
 *  - Turn-taking (interrupt support for natural conversation)
 */
export function useElevenLabsConversation(): UseElevenLabsConversationReturn {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      setStatus("connected");
    },
    onDisconnect: () => {
      setStatus("disconnected");
    },
    onError: (error: string) => {
      console.error("ElevenLabs conversation error:", error);
      setStatus("error");
    },
    onMessage: (message: { source: string; message: string }) => {
      const role = message.source === "ai" ? "agent" : "user";
      setTranscript((prev) => [
        ...prev,
        { role, text: message.message, timestamp: Date.now() },
      ]);
    },
  });

  const isSpeaking = conversation.isSpeaking;

  /**
   * Fetch a signed URL from our API route, then start the conversation.
   */
  const connect = useCallback(async () => {
    setStatus("connecting");
    setTranscript([]);

    try {
      // 1. Request microphone permission early for smoother UX
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Fetch signed URL from server
      const res = await fetch("/api/signed-url");
      if (!res.ok) throw new Error("Failed to get signed URL");
      const { signedUrl } = await res.json();

      // 3. Start the ElevenLabs conversation session via the SDK
      await conversation.startSession({
        signedUrl,
      });
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("error");
    }
  }, [conversation]);

  /**
   * Cleanly end the conversation session.
   */
  const disconnect = useCallback(async () => {
    await conversation.endSession();
    setStatus("disconnected");
  }, [conversation]);

  return {
    status,
    isSpeaking,
    transcript,
    connect,
    disconnect,
  };
}
