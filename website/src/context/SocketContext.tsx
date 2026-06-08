import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket } from '../services/socket';
import { getSocketServerUrl } from '../utils/runtimeConfig';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Explicitly pass the resolved socket URL from runtimeConfig so
    // SocketContext does not rely on socket.ts's default parameter.
    const socketInstance = initializeSocket(getSocketServerUrl());
    setSocket(socketInstance);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    // Initial state
    setIsConnected(socketInstance.connected);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      // Removed disconnectSocket() to preserve singleton connection across route changes
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
