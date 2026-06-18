import { useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * Generic callback type for socket event handlers.
 * Uses unknown[] internally for type safety; callers narrow via generics.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketEventCallback<T extends unknown[] = any[]> = (...args: T) => void;

/**
 * Hook to strictly manage socket event listeners to prevent memory leaks
 */
export function useSocket<T extends unknown[] = unknown[]>(
  event: string,
  callback: SocketEventCallback<T>
) {
  const { socket } = useSocketContext();
  const savedCallback = useRef<SocketEventCallback<T>>();
  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  // Set up the listener — uses unknown[] at the boundary; cast is safe
  // because the caller is responsible for matching the event payload type.
  useEffect(() => {
    if (!socket) return;
    const listener = (...args: unknown[]) => {
      if (savedCallback.current) {
        savedCallback.current(...(args as T));
      }
    };
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event, socket]);
  return socket;
}
