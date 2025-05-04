import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./chat.module.css";
import io, { Socket } from "socket.io-client";
import {
  ActionIcon,
  Box,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconSend } from "@tabler/icons-react";

type SystemMessageData = {
  type: "system";
  message: string;
};
type OwnMessageData = {
  type: "own";
  ts: number;
  message: string;
  sent: boolean;
};
type ReceivedMessageData = {
  type: "received";
  ts: number;
  name: string;
  message: string;
};
type ChatMessageData = SystemMessageData | OwnMessageData | ReceivedMessageData;

const startOfChatMsg: SystemMessageData = {
  type: "system",
  message: "start of live chat",
};

export default function Chat() {
  const socketRef = useRef<Socket | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessageData[]>([startOfChatMsg]);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const scrollThreshPx = 100;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < scrollThreshPx;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (isAtBottom) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  const onConnect = () => {
    setIsLoading(false);
  };

  const onDisconnect = () => {
    setIsLoading(true);
  };

  const sendMessage = (message: string) => {
    let idx: number;
    setMessages((msgs) => {
      idx = msgs.length;
      const newMsg: OwnMessageData = {
        type: "own",
        ts: 0,
        sent: false,
        message,
      };
      return msgs.concat(newMsg);
    });

    socketRef.current!.emit(
      "send_message",
      { content: message },
      (ack: unknown) => {
        if (
          typeof ack !== "object" ||
          ack === null ||
          !("ts" in ack) ||
          typeof ack.ts !== "number"
        ) {
          console.error("unexpected message ack", { ack });
          return;
        }
        console.log("received ack for idx", idx, ack);
        setMessages((msgs) => {
          const msgData = msgs[idx] as OwnMessageData;
          const newMsgs = [...msgs];
          newMsgs[idx] = { ...msgData, ts: ack.ts as number, sent: true };
          return newMsgs;
        });
      }
    );
  };

  useEffect(() => {
    const socket = io();
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
    <Box className="h-full w-full flex flex-col min-h-0">
      <LoadingOverlay visible={false && isLoading} />

      <Paper
        p="xl"
        shadow="xs"
        className="bg-neutral-800 h-full flex flex-col min-h-0"
      >
        <Box
          className="flex-1 overflow-auto min-h-0"
          ref={containerRef}
          onScroll={onScroll}
        >
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          <div ref={endOfMessagesRef} />
        </Box>
        <Box className="shrink-0">
          <ComposeMessage sendMessage={sendMessage} />
        </Box>
      </Paper>
    </Box>
  );
}

const ChatMessage: React.FC<{ msg: ChatMessageData }> = ({ msg }) => {
  return msg.type === "system" ? (
    <SystemMessage message={msg.message} />
  ) : msg.type === "own" ? (
    <SentMessage message={msg.message} sent={msg.sent} />
  ) : msg.type === "received" ? (
    <ReceivedMessage name={msg.name} message={msg.message} />
  ) : null;
};

const SystemMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <Group w="100%" mt="1rem" justify="center">
      <Box style={{ fontVariant: "small-caps" }}>{message}</Box>
    </Group>
  );
};

const ReceivedMessage: React.FC<{
  name: string;
  message: string;
}> = ({ name, message }) => {
  return (
    <Group w="100%" mt="1rem" justify="flex-start">
      <Box className={`${styles.messageBox} ${styles.messageBoxReceived}`}>
        <Box className={styles.messageAuthor}>{name}</Box>
        <div>{message}</div>
      </Box>
    </Group>
  );
};

const SentMessage: React.FC<{
  message: string;
  sent: boolean;
}> = ({ message, sent }) => {
  return (
    <Group w="100%" mt="1rem" justify="flex-end" align="flex-end" gap="0.25rem">
      <Box className={`${styles.messageBox} ${styles.messageBoxSent}`}>
        <Box className={styles.sentMessage}>{message}</Box>
      </Box>
      {sent ? null : <IconSend />}
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
