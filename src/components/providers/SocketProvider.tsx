import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { pusherClient } from '../../lib/pusher';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed';

interface SocketContextType {
  /** The current connection state of the WebSocket client */
  connectionState: ConnectionState;
  /** Whether the client is currently connected */
  isConnected: boolean;
  /** Subscribe to a WebSocket channel and bind to a specific event */
  subscribe: (channelName: string, eventName: string, callback: (data: any) => void) => void;
  /** Unbind from a specific event and unsubscribe from the channel */
  unsubscribe: (channelName: string, eventName: string, callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

/**
 * SocketProvider establishes a real-time connection using Pusher and
 * manages subscription logic throughout the component tree.
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // Sync connection state with Pusher connection manager
  useEffect(() => {
    if (!pusherClient) {
      console.warn('[SocketProvider] pusherClient is not initialized on this environment.');
      return;
    }

    const handleStateChange = (states: { current: ConnectionState }) => {
      console.log(
        `[SocketProvider] Connection state changed from ${states.previous || 'unknown'} to ${states.current}`
      );
      setConnectionState(states.current);
    };

    pusherClient.connection.bind('state_change', handleStateChange);
    setConnectionState(pusherClient.connection.state as ConnectionState);

    // Initial explicit connect request
    pusherClient.connect();

    return () => {
      if (pusherClient) {
        pusherClient.connection.unbind('state_change', handleStateChange);
        pusherClient.disconnect();
      }
    };
  }, []);

  /**
   * Subscribe to a channel and listen for events.
   */
  const subscribe = useCallback(
    (channelName: string, eventName: string, callback: (data: any) => void) => {
      if (!pusherClient) return;

      console.log(`[SocketProvider] Subscribing to channel: ${channelName}, event: ${eventName}`);
      const channel = pusherClient.subscribe(channelName);

      // Bind event handler
      channel.bind(eventName, callback);
    },
    []
  );

  /**
   * Unsubscribe from a channel or unbind an event listener.
   */
  const unsubscribe = useCallback(
    (channelName: string, eventName: string, callback: (data: any) => void) => {
      if (!pusherClient) return;

      console.log(
        `[SocketProvider] Unsubscribing from channel: ${channelName}, event: ${eventName}`
      );
      const channel = pusherClient.channel(channelName);
      if (channel) {
        channel.unbind(eventName, callback);
      }

      // Clean up the channel subscription entirely
      pusherClient.unsubscribe(channelName);
    },
    []
  );

  return (
    <SocketContext.Provider
      value={{
        connectionState,
        isConnected: connectionState === 'connected',
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Custom React Hook to access SocketContext and manage real-time subscriptions inside components.
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
