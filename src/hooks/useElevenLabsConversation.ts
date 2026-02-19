import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { createSessionGuard } from "@/lib/sessionGuard";

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
  /** First message the agent speaks on connect */
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
 * Hook that wraps @elevenlabs/react useConversation with guards against
 * the "WebSocket is already in CLOSING or CLOSED state" error.
 *
 * The core problem: React Strict Mode (and normal unmount/remount cycles)
 * causes endSession() to fire while the SDK's internal WebSocket is still
 * sending the greeting. The WebSocket transitions to CLOSING, then the
 * re-mount calls startSession() which tries to reuse or races with the
 * dying socket.
 *
 * Fix strategy:
 * 1. Serialize connect/disconnect through a guard that tracks generations
 *    and waits for any in-flight teardown before starting a new session.
 * 2. Delay cleanup endSession by 100ms — if a re-mount happens within
 *    that window (Strict Mode), cancel the cleanup entirely.
 * 3. Only send endSession if the generation hasn't advanced (no new
 *    session superseded this one).
 * 4. Keep the session alive on beforeunload so tab-close doesn't race.
 */
export function useElevenLabsConversation(
  options?: UseElevenLabsConversationOptions
): UseElevenLabsConversationReturn {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // Session guard — persists across re-renders via ref
  const guardRef = useRef(createSessionGuard());
  const guard = guardRef.current;

  // Track whether we've been intentionally disconnected by the user
  const userDisconnectedRef = useRef(false);

  // Cleanup timer ref for delayed teardown
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Only transition to "disconnected" if the user explicitly asked,
      // or if we're not in the middle of a Strict Mode remount cycle.
      if (userDisconnectedRef.current) {
        setStatus("disconnected");
      }
    },
    onError: (error: string) => {
      console.error("ElevenLabs conversation error:", error);
      // Don't set error state if we're in the middle of a teardown —
      // the "WebSocket closed" error during cleanup is expected.
      if (!guard.getIsConnecting()) {
        setStatus("error");
      }
    },
    onMessage: (message: { source: string; message: string }) => {
      const role = message.source === "ai" ? "agent" : "user";
      setTranscript((prev) => [
        ...prev,
        { role, text: message.message, timestamp: Date.now() },
      ]);
    },
  });

  // Stable ref so callbacks don't go stale
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  const isSpeaking = conversation.isSpeaking;

  /**
   * Connect: serialized through the guard to prevent overlapping sessions.
   */
  const connect = useCallback(async () => {
    // Cancel any pending delayed cleanup from a previous unmount
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    // Prevent overlapping connect calls
    if (guard.getIsConnecting()) return;
    guard.setIsConnecting(true);

    userDisconnectedRef.current = false;
    setStatus("connecting");
    setTranscript([]);

    try {
      // Wait for any in-flight teardown to fully complete.
      // This is the key fix: without this, startSession() races with
      // the old session's WebSocket CLOSING state.
      await guard.waitForTeardown();

      // Advance generation so any stale cleanup becomes a no-op
      const gen = guard.nextGeneration();

      // 1. Request mic access (user gesture context)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Warm AudioContext to prevent browser auto-suspend
      try {
        const ctx = new AudioContext();
        if (ctx.state === "suspended") await ctx.resume();
        ctx.close();
      } catch {
        // Best-effort
      }

      // 3. Release mic — SDK requests its own
      stream.getTracks().forEach((t) => t.stop());

      // 4. Bail if a newer connect() was called while we were awaiting
      if (guard.currentGeneration() !== gen) {
        guard.setIsConnecting(false);
        return;
      }

      // 5. Fetch signed URL
      const res = await fetch("/api/signed-url");
      if (!res.ok) throw new Error("Failed to get signed URL");
      const { signedUrl } = await res.json();

      // 6. Bail check again after async fetch
      if (guard.currentGeneration() !== gen) {
        guard.setIsConnecting(false);
        return;
      }

      // 7. Start session — overrides already configured in useConversation
      await conversationRef.current.startSession({ signedUrl });

      guard.setIsConnecting(false);
    } catch (error) {
      console.error("Connection failed:", error);
      guard.setIsConnecting(false);
      setStatus("error");
    }
  }, [guard]);

  /**
   * Disconnect: user-initiated. Serialized through the guard.
   */
  const disconnect = useCallback(async () => {
    userDisconnectedRef.current = true;
    const teardown = (async () => {
      try {
        await conversationRef.current.endSession();
      } catch {
        // endSession may throw if already closed — that's fine
      }
    })();
    guard.setTeardownPromise(teardown);
    await teardown;
    setStatus("disconnected");
  }, [guard]);

  /**
   * Lifecycle: handle unmount cleanup with a delayed teardown.
   *
   * Why delayed? React Strict Mode unmounts and immediately remounts.
   * If we call endSession() synchronously in cleanup, the WebSocket
   * enters CLOSING state, and the remount's startSession() fails with
   * "WebSocket is already in CLOSING or CLOSED state".
   *
   * By delaying 150ms, we give the remount a chance to cancel the
   * cleanup via clearTimeout in connect(). If no remount happens
   * (real unmount), the cleanup fires normally.
   */
  useEffect(() => {
    // On mount: cancel any pending cleanup from a previous unmount cycle
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const genAtMount = guard.currentGeneration();

    return () => {
      // Don't tear down immediately — delay to survive Strict Mode
      cleanupTimerRef.current = setTimeout(() => {
        // Only tear down if no new session was started
        if (guard.currentGeneration() === genAtMount) {
          conversationRef.current.endSession().catch(() => {});
        }
      }, 150);
    };
  }, [guard]);

  /**
   * Keep the WebSocket alive when the tab closes.
   * Without this, the browser fires pagehide/beforeunload which can
   * cause the SDK to start closing the WS before we want it to.
   * We explicitly end the session on unload to avoid orphaned connections.
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Synchronous endSession attempt — best-effort on tab close
      try {
        conversationRef.current.endSession();
      } catch {
        // Ignore — tab is closing anyway
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return {
    status,
    isSpeaking,
    transcript,
    connect,
    disconnect,
  };
}
