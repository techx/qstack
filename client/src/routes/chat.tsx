import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./chat.module.css";
import io, { Socket } from "socket.io-client";
import {
  ActionIcon,
  Box,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconSend } from "@tabler/icons-react";

type OwnMessageData = { type: "own"; ts: number; message: string };
type ReceivedMessageData = {
  type: "received";
  ts: number;
  name: string;
  message: string;
};
type ChatMessageData = OwnMessageData | ReceivedMessageData;

export default function Chat() {
  const socketRef = useRef<Socket | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      type: "received",
      ts: 0,
      name: "gurt",
      message:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliq",
    },
    {
      type: "own",
      ts: 0,
      message:
        "nah, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    },
  ]);

  function onConnect() {
    setIsLoading(false);
  }

  function onDisconnect() {
    setIsLoading(true);
  }

  useEffect(() => {
    const socket = io({ autoConnect: false });
    socketRef.current = socket;
    (window as unknown as Record<string, Socket>).socket = socketRef.current;

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("recv_message", (msg) => {
      if (!msg.name || !msg.message) return;
      const newMsg: ChatMessageData = {
        type: "received",
        ts: msg.ts || 0,
        name: msg.name.toString(),
        message: msg.message.toString(),
      };
      setMessages((currMsgs) => currMsgs.concat(newMsg));
    });

    return () => {
      socketRef.current!.disconnect();
    };
  }, []);

  return (
    <Container w="100%" size="md" py="6rem">
      <LoadingOverlay visible={false && isLoading} />

      <Paper w="100%" p="xl" shadow="xs" className="bg-neutral-800">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        <ComposeMessage sendMessage={(msg) => console.log("sending mesg", msg)} />
      </Paper>
    </Container>
  );
}

const ChatMessage: React.FC<{ msg: ChatMessageData }> = ({ msg }) => {
  return msg.type === "own" ? (
    <SentMessage message={msg.message} />
  ) : (
    <ReceivedMessage name={msg.name} message={msg.message} />
  );
};

const ReceivedMessage: React.FC<{
  name: string;
  message: string;
}> = ({ name, message }) => {
  return (
    <Group w="100%" mt="1rem" justify="flex-start">
      <Box className={`${styles.messageBox} ${styles.messageBoxReceived}`}>
        <Box fz="lg" className={styles.messageAuthor}>
          {name}
        </Box>
        <div>{message}</div>
      </Box>
    </Group>
  );
};

const SentMessage: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <Group w="100%" mt="1rem" justify="flex-end">
      <Box className={`${styles.messageBox} ${styles.messageBoxSent}`}>
        <Box className={styles.sentMessage}>{message}</Box>
      </Box>
    </Group>
  );
};

const ComposeMessage: React.FC<{
  sendMessage: (msg: string) => void;
}> = ({ sendMessage }) => {
  const form = useForm({
    mode: "controlled",
    initialValues: {
      message: "",
    },
  });

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (evt) => {
    if (evt.key === "Enter" && evt.shiftKey) {
      evt.preventDefault();
    }
  };

  const onSubmit = form.onSubmit(({ message }) => {
    if (!message) return;
    form.reset();
    sendMessage(message);
  });

  return (
    <Box className={styles.composeContainer}>
      <form onSubmit={onSubmit} onReset={form.onReset}>
        <Group w="100%" gap="0.5rem" wrap="nowrap">
          <TextInput
            w="100%"
            placeholder="Message"
            onKeyDown={onKeyDown}
            {...form.getInputProps("message")}
          />
          <ActionIcon type="submit" size="lg">
            <IconSend />
          </ActionIcon>
        </Group>
      </form>
    </Box>
  );
};
