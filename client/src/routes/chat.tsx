import { useState } from "react";
import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";


export default function ChatRoomButton() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleError = (message: string) => {
    notifications.show({
      title: "Error",
      color: "red",
      message,
    });
  };

  const onCreateChatRoom = async () => {
    const token = localStorage.getItem("jwt_token"); // Retrieve the stored token

    if (!token) {
      handleError("No JWT token found. Please log in.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5555/chat_room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const chatRoom = await response.json();
      navigate(`/chat/${chatRoom.chat_room_id}`);
    } catch (error) {
      handleError(`Failed to create chat room: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={() => onCreateChatRoom()}
        loading={isLoading}
        disabled={isLoading}
      >
        Message
      </Button>
    </div>
  );
}