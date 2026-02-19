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

interface UseElevenLabsConversationOptions {
  /** Dynamic system prompt injected via overrides at session start. */
  systemPrompt?: string;
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
 * Accepts an optional systemPrompt that is injected into the agent
 * session via the `overrides` API — this is how the recipe context
 * reaches the voice agent at runtime without hardcoding it in the
 * ElevenLabs dashboard.
 */
export function useElevenLabsConversation(
  options?: UseElevenLabsConversationOptions
): UseElevenLabsConversationReturn {
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
   * If a systemPrompt was provided, inject it as an agent prompt override
   * so the voice agent has full recipe context for the session.
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

      // 3. Build session config, injecting recipe context via overrides
      const sessionConfig: Record<string, unknown> = { signedUrl };

      if (options?.systemPrompt) {
        sessionConfig.overrides = {
          agent: {
            prompt: {
              prompt: options.systemPrompt,
            },
          },
        };
      }

      // 4. Start the ElevenLabs conversation session via the SDK
      await conversation.startSession(sessionConfig);
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("error");
    }
  }, [conversation, options?.systemPrompt]);

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
