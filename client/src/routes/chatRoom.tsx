import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import styles from "./chat.module.css";


const socket = io("http://127.0.0.1:3001", { transports: ["polling", "websocket"] });

export default function ChatRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name") || "";
  // TODO: get code from the url getParams
  const code = queryParams.get("code") || "";

  const [messages, setMessages] = useState<{ name: string; message: string }[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!name || !code) {
      navigate("/");
      return;
    }

    socket.emit("join", { name, code });

    socket.on("message", (data: { name: string; message: string }) => {
      console.log("new message:", data)
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off("message");
      socket.emit("leave", { name, code });
    };
  }, [name, code, navigate]);

  const sendMessage = () => {
    if (message.trim() === "") return;
    socket.emit("message", { data: message });
    setMessage("");
  };

  return (
    <div className={styles.content}>
      <div className={styles.messageBox}>
        <h2>Chat Room: {code}</h2>
        {/* add a message that says chat not saved, if they refresh ask are you sure you will lose your chat msg */}
        <div className={styles.messages}>
            {/* Temporary hardcoded message for debugging */}
          <div className={styles.text}>
            <span>
              <strong>Test User</strong>: This is a test message
            </span>
            {/* TODO: check out date problem */}
            <span className={styles.muted}>{new Date().toLocaleString()}</span>
          </div>
          
          {messages.map((msg, index) => (
            <div key={index} className={styles.text}>
              <span>
                <strong>{msg.name}</strong>: {msg.message}
              </span>
              <span className={styles.muted}>{new Date().toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className={styles.inputs}>
          <textarea
            rows={3}
            placeholder="Message"
            name="message"
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="button" name="send" id="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}