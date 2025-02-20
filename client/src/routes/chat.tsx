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
    // TODO: use ChatRoom model, you will need to call an API endpoint here
    // TODO: create an API endpoint in chat.py
    // check that the code is existing in the database (if not error)
    // if code is existing, check that the room is active (if not error)
    // if room is active, check that the room is not full (if full error)
    // if user is added to room, navigate to the room
    // navigate to "/room/${code}" also change in App.tsx
    navigate(`/room?name=${encodeURIComponent(name)}&code=${encodeURIComponent(code)}`);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please enter a name.");
      return;
    }
    // TODO: call api endpoint / create it
    // need to check that randomly generated code does not exist in datbase
    // if it does, generate a new one until it does not exist in the database
    // if it does not exist, create the room in the database
    // if room is created, navigate to the room
    // navigate to "/room/${code}" also change in App.tsx
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