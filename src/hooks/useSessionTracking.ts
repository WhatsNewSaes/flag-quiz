import { useEffect, useRef } from 'react';
import {
  startSession,
  endSession,
  PlayMode,
  SessionHandle,
  SessionResult,
} from '../lib/analytics';

// Tracks one gameplay session for a game hook/screen.
//
// - When `isActive` flips false → true, a session starts (metadata is pulled
//   from getResult() at that moment).
// - When it flips true → false, the session ends as completed.
// - If the component unmounts while still active (user navigated away mid-game),
//   the session ends as not-completed (abandoned). Tab close / backgrounding is
//   handled separately by the flush listener in lib/analytics.
//
// `getResult` returns the latest stats (score/correct/total/metadata); it's read
// through a ref so it never needs to be a stable reference.
export function useSessionTracking(
  mode: PlayMode,
  isActive: boolean,
  getResult?: () => SessionResult,
): void {
  const getResultRef = useRef(getResult);
  getResultRef.current = getResult;
  const handleRef = useRef<SessionHandle | null>(null);

  useEffect(() => {
    if (isActive && !handleRef.current) {
      handleRef.current = startSession(mode, getResultRef.current?.().metadata);
    } else if (!isActive && handleRef.current) {
      endSession(handleRef.current, { completed: true, ...getResultRef.current?.() });
      handleRef.current = null;
    }
  }, [isActive, mode]);

  // Abandoned end on unmount (only fires if a session is still open).
  useEffect(() => {
    return () => {
      if (handleRef.current) {
        endSession(handleRef.current, { completed: false, ...getResultRef.current?.() });
        handleRef.current = null;
      }
    };
  }, []);
}
