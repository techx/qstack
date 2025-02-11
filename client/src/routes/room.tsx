import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const [messages, setMessages] = useState([]);
const [messageInput, setMessageInput] = useState('')
const socketRef = useRef(null)

useEffect(() => {
    // Initialize the socket inside useEffect
    socketRef.current = io('http://localhost:5555', {
      query: { token: localStorage.getItem('jwt_token') },
      transports: ['websocket'] // Force WebSocket transport
    });

    // Function to set up socket event listeners
    const setupSocketListeners = () => {
      socketRef.current.on('new_message', (newMessageData) => {
        const newMessage = newMessageData.message ? { content: newMessageData.message } : newMessageData;
        setMessages(prevMessages => [...prevMessages, newMessage]);
    });
    }

    if (chatRoomId) {
      // Emit event to join the room
      socketRef.current.emit('join_room', { chat_room_id: chatRoomId });

      setupSocketListeners();

      const fetchMessages = async () => {
        try {
          const response = await fetch(`http://localhost:5555/chat_room/${chatRoomId}/messages`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
          });
          if (!response.ok) {
            handleError('Network response was not okay!');
          }
          const messages = await response.json();
          setMessages(messages);
        } catch (error) {
          handleError(`Error fetching messages: ${error}`);
        }
      };

      fetchMessages();
    }

    return () => {
      socketRef.current.off('new_message');
      socketRef.current.emit('leave_room', { chat_room_id: chatRoomId });
      socketRef.current.disconnect();
    };
  }, [chatRoomId]) 