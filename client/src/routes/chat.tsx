import React, { Ref, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./chat.module.css";
import io, { Socket } from "socket.io-client";
import { useSetState } from "@mantine/hooks";

export default function Chat() {
  const socketRef = useRef<Socket | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<bool>(true);

  function onConnect() {
    setIsLoading(false);
  }

  function onDisconnect() {
    setIsLoading(true);
  }

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    (window as unknown as Record<string, Socket>).socket = socketRef.current;

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("message", (msg) => {
      console.log("message", msg);
    });

    return () => {
      socketRef.current!.disconnect();
    };
  }, []);

  return (
    <>
      {isLoading ? <div>Loading...</div> : null}
      {!isLoading ? <div>hello world</div> : null}
    </>
  );
}
