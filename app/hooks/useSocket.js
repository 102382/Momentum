"use client";
import { useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

// Ik bewaar de socket hier zodat ik er maar 1 heb.
let globalSocket = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    // Ik gebruik de bestaande socket als die er al is.
    if (globalSocket) {
      socketRef.current = globalSocket;
      return;
    }

    // Ik maak een nieuwe verbinding aan.
    const API_URL =
      typeof window !== "undefined"
        ? window.location.protocol + "//" + window.location.hostname + ":3001"
        : "http://localhost:3001";

    const socket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      connectedRef.current = true;
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
      connectedRef.current = false;
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    globalSocket = socket;
    socketRef.current = socket;

    return () => {
      // Ik sluit de verbinding niet. Zo blijft hij open.
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && connectedRef.current) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit '${event}' - socket not connected`);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current.off(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: connectedRef.current,
    emit,
    on,
    off,
  };
};
