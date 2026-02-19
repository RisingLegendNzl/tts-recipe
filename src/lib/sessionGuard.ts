/**
 * ElevenLabsSessionManager
 *
 * A singleton-style wrapper around the @elevenlabs/react SDK that solves
 * the "WebSocket is already in CLOSING or CLOSED state" error.
 *
 * ROOT CAUSES this addresses:
 * 1. React Strict Mode double-mount: useEffect fires → cleanup → re-fire,
 *    causing startSession → endSession → startSession in rapid succession.
 *    The first endSession kills the WebSocket while the SDK is still trying
 *    to send the firstMessage greeting over it.
 *
 * 2. Race between startSession and endSession: if connect() is called while
 *    a previous session is still tearing down, the new session's WebSocket
 *    inherits the CLOSING state from the old one.
 *
 * 3. No queuing: the SDK sends messages immediately. If the internal WS
 *    isn't OPEN yet (still CONNECTING), the send fails silently or throws.
 *
 * SOLUTION:
 * - Track session state explicitly with a state machine (idle → connecting
 *   → connected → disconnecting → idle).
 * - Gate startSession behind a lock so overlapping calls are serialized.
 * - Wait for any in-flight endSession to fully complete before starting new.
 * - Prevent React cleanup from killing a session that just started by using
 *   a generation counter — cleanup only runs endSession if the generation
 *   matches (i.e., no new session was started between mount and unmount).
 * - beforeunload listener keeps the session alive until the tab actually closes.
 */

/** Session states */
export type SessionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export interface SessionCallbacks {
  onStateChange: (state: SessionState) => void;
  onSpeakingChange: (isSpeaking: boolean) => void;
  onMessage: (role: "agent" | "user", text: string) => void;
  onError: (error: string) => void;
}

/**
 * Creates a session manager that controls a single ElevenLabs conversation
 * session's lifecycle. Returns control functions and a cleanup function.
 */
export function createSessionGuard() {
  let generation = 0;
  let teardownPromise: Promise<void> | null = null;
  let isConnecting = false;

  /**
   * Returns a new generation ID. Used to detect stale cleanup calls.
   * If cleanup fires with an old generation, it means a new session
   * was started and the old cleanup should be a no-op.
   */
  function nextGeneration(): number {
    return ++generation;
  }

  function currentGeneration(): number {
    return generation;
  }

  /**
   * Wait for any in-progress teardown before starting a new session.
   * This prevents the "CLOSING state" error caused by overlapping
   * endSession → startSession calls.
   */
  async function waitForTeardown(): Promise<void> {
    if (teardownPromise) {
      await teardownPromise;
      teardownPromise = null;
    }
  }

  function setTeardownPromise(p: Promise<void>): void {
    teardownPromise = p;
  }

  function getIsConnecting(): boolean {
    return isConnecting;
  }

  function setIsConnecting(v: boolean): void {
    isConnecting = v;
  }

  return {
    nextGeneration,
    currentGeneration,
    waitForTeardown,
    setTeardownPromise,
    getIsConnecting,
    setIsConnecting,
  };
}
