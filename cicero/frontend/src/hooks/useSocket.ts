import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { RequestLog } from '../types';

export const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [newRequest, setNewRequest] = useState<RequestLog | null>(null);

  useEffect(() => {
    const socketInstance = io(serverUrl);

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Connected to Cicero server');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from Cicero server');
    });

    socketInstance.on('new-request', (data: RequestLog) => {
      setNewRequest(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [serverUrl]);

  return { socket, connected, newRequest };
};