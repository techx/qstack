import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./chat.module.css";

export default function Chat() {
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      setError("Please enter a name and room code.");
      return;
    }

    try {
      const response = await fetch("/api/chat/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          code,
          join: true
        })
      });

      if (response.ok) {
        navigate(`/room/${code}`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to join room");
      }
    } catch (err) {
      setError("Error connecting to server");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please enter a name.");
      return;
    }

    try {
      const response = await fetch("/api/chat/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          create: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.code);
        navigate(`/room/${data.code}`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create room");
      }
    } catch (err) {
      setError("Error connecting to server");
    }
  };

  return (
    <div className={styles.content}>
      <form method="post" className={styles.buttons} onSubmit={handleJoinRoom}>
        <h3>Enter The Chat Room</h3>
        <div>
          <label>Name:</label>
          <input
            type="text"
            placeholder="Pick a name!"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.join}>
          <input
            type="text"
            placeholder="Room Code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <button type="submit" name="join">
            Join a Room
          </button>
        </div>
        <button type="button" name="create" className={styles.createBtn} onClick={handleCreateRoom}>
          Create a Room
        </button>
        {error && (
          <ul>
            <li>{error}</li>
          </ul>
        )}
      </form>
    </div>
  );
}