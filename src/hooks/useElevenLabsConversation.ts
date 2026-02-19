import { useCallback, useRef, useState } from "react";
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
  /** System prompt injected via overrides.agent.prompt.prompt */
  systemPrompt?: string;
  /** First message the agent speaks on connect, via overrides.agent.firstMessage */
  firstMessage?: string;
}

interface UseElevenLabsConversationReturn {
  status: ConversationStatus;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Hook that wraps the official @elevenlabs/react useConversation hook.
 *
 * KEY FIX: Overrides (prompt, firstMessage, language) MUST be passed to
 * useConversation(), not startSession(). The startSession() call only
 * accepts connection params (signedUrl, agentId, connectionType, etc.).
 * Putting overrides in startSession silently drops them, causing the
 * agent to have no greeting and no recipe context.
 */
export function useElevenLabsConversation(
  options?: UseElevenLabsConversationOptions
): UseElevenLabsConversationReturn {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // Pass overrides to useConversation — this is where the SDK reads them.
  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: options?.systemPrompt ?? "",
        },
        firstMessage: options?.firstMessage,
        language: "en",
      },
    },
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

  // Stable ref to avoid connect callback changing on every render
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  const isSpeaking = conversation.isSpeaking;

  /**
   * Fetch a signed URL, then start the session.
   * startSession only receives connection params — overrides are
   * already configured in useConversation above.
   */
  const connect = useCallback(async () => {
    setStatus("connecting");
    setTranscript([]);

    try {
      // 1. Request microphone access — must happen from a user-gesture
      //    context or on page load before we open the WebSocket.
      //    Getting the stream also "warms up" the AudioContext so
      //    the browser doesn't suspend it on first play.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Warm up AudioContext to prevent browser auto-suspend.
      //    Some browsers (Chrome, Safari) create the AudioContext in a
      //    "suspended" state and only resume it after user interaction.
      //    By creating and resuming one here, we ensure audio playback
      //    starts immediately when the agent's first message arrives.
      try {
        const ctx = new AudioContext();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        // We don't need to keep this context — the SDK creates its own.
        // This just ensures the browser's audio policy is unlocked.
        ctx.close();
      } catch {
        // AudioContext warm-up is best-effort; don't block on failure.
      }

      // 3. Release the mic stream — the SDK will request its own.
      stream.getTracks().forEach((t) => t.stop());

      // 4. Fetch signed URL from our server-side API route.
      const res = await fetch("/api/signed-url");
      if (!res.ok) throw new Error("Failed to get signed URL");
      const { signedUrl } = await res.json();

      // 5. Start the session — only connection params here.
      //    The overrides (prompt, firstMessage) were already set in
      //    useConversation above. The agent will immediately speak
      //    the firstMessage once the WebSocket connects.
      await conversationRef.current.startSession({ signedUrl });
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("error");
    }
  }, []); // Stable: no deps that change per render

  const disconnect = useCallback(async () => {
    await conversationRef.current.endSession();
    setStatus("disconnected");
  }, []);

  return {
    status,
    isSpeaking,
    transcript,
    connect,
    disconnect,
  };
}
