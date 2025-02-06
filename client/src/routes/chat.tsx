import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./chat.module.css";

export default function Chat() {
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      setError("Please enter a name and room code.");
      return;
    }
    navigate(`/room?name=${encodeURIComponent(name)}&code=${encodeURIComponent(code)}`);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please enter a name.");
      return;
    }
    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    navigate(`/room?name=${encodeURIComponent(name)}&code=${encodeURIComponent(newCode)}`);
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
            onChange={(e) => setCode(e.target.value)}
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