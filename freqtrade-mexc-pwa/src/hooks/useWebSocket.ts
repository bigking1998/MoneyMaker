'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketState {
  socket: WebSocket | null;
  lastMessage: MessageEvent | null;
  readyState: number;
  lastJsonMessage: any;
}

export const useWebSocket = (options: WebSocketOptions) => {
  const [socketState, setSocketState] = useState<WebSocketState>({
    socket: null,
    lastMessage: null,
    readyState: WebSocket.CONNECTING,
    lastJsonMessage: null,
  });

  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Uninstantiated'>('Uninstantiated');
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const messageHistory = useRef<MessageEvent[]>([]);

  const {
    url,
    protocols,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url, protocols);
      
      socket.onopen = (event) => {
        setConnectionStatus('Open');
        setSocketState(prev => ({
          ...prev,
          socket,
          readyState: socket.readyState
        }));
        reconnectAttempts.current = 0;
      };

      socket.onmessage = (event) => {
        const message = event;
        messageHistory.current.push(message);
        
        // Keep only last 100 messages
        if (messageHistory.current.length > 100) {
          messageHistory.current = messageHistory.current.slice(-100);
        }

        let jsonMessage = null;
        try {
          jsonMessage = JSON.parse(event.data);
        } catch (error) {
          // Not JSON, ignore
        }

        setSocketState(prev => ({
          ...prev,
          lastMessage: message,
          lastJsonMessage: jsonMessage,
          readyState: socket.readyState
        }));
      };

      socket.onclose = (event) => {
        setConnectionStatus('Closed');
        setSocketState(prev => ({
          ...prev,
          socket: null,
          readyState: WebSocket.CLOSED
        }));

        // Attempt reconnection if enabled and within limits
        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (event) => {
        setConnectionStatus('Closed');
        console.error('WebSocket error:', event);
      };

      setConnectionStatus('Connecting');
      setSocketState(prev => ({
        ...prev,
        socket,
        readyState: socket.readyState
      }));

    } catch (error) {
      setConnectionStatus('Closed');
      console.error('Failed to create WebSocket:', error);
    }
  }, [url, protocols, reconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (socketState.socket) {
      socketState.socket.close();
    }
  }, [socketState.socket]);

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketState.socket && socketState.readyState === WebSocket.OPEN) {
      socketState.socket.send(data);
    } else {
      console.warn('WebSocket is not open. ReadyState:', socketState.readyState);
    }
  }, [socketState.socket, socketState.readyState]);

  const sendJsonMessage = useCallback((data: any) => {
    sendMessage(JSON.stringify(data));
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
    };
  }, []);

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage: socketState.lastMessage,
    lastJsonMessage: socketState.lastJsonMessage,
    readyState: socketState.readyState,
    connectionStatus,
    socket: socketState.socket,
    getWebSocket: () => socketState.socket,
    
    // Message history
    messageHistory: messageHistory.current,
    
    // Connection control
    connect,
    disconnect,
  };
};