import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import styles from "./chat.module.css";

// Create socket instance outside component to avoid recreation on re-renders
const socket = io("http://127.0.0.1:3001", {
  autoConnect: false // Prevent auto-connecting before we have user details
});

export default function ChatRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const [messages, setMessages] = useState<{ name: string; message: string }[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get name from session storage
    const storedName = sessionStorage.getItem("chatName");
    if (!storedName || !code) {
      navigate("/chat");
      return;
    }
    setName(storedName);

    // Connect only when we have valid name and code
    socket.connect();
    socket.emit("join", { name: storedName, code });

    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("message", (data: { name: string; message: string }) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Cleanup function
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message");
      socket.disconnect();
    };
  }, [code, navigate]);

  const sendMessage = () => {
    if (message.trim() === "" || !isConnected) return;
    socket.emit("message", { data: message });
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.messageBox}>
        <div className={styles.header}>
          <h2>Chat Room: {code}</h2>
          <span className={isConnected ? styles.connected : styles.disconnected}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className={styles.messages}>
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.text} ${msg.name === name ? styles.ownMessage : ''}`}>
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
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            name="message"
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isConnected}
          />
          <button 
            type="button" 
            name="send" 
            id="send-btn" 
            onClick={sendMessage}
            disabled={!isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}