import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  Paper,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconExternalLink, IconSend } from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import styles from "./chat.module.css";

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

const historyWarningMsg: SystemMessageData = {
  type: "system",
  message: "History doesn't save, do not exit this page",
};

export type ChatProps = {
  popOutLink: boolean;
};

export default function Chat({ popOutLink }: ChatProps) {
  const socketRef = useRef<Socket | undefined>(undefined);
  const [openError, setOpenError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>("Unknown");
  const [partnerRole, setPartnerRole] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageData[]>([
    startOfChatMsg,
    historyWarningMsg,
  ]);
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
    setIsActive(true);
  };

  const onDisconnect = (socket: Socket) => {
    // if socket.active is true, we are reconnecting
    setIsLoading(socket.active);
    // if socket.active is false, disable message box
    setIsActive(socket.active);
  };

  const playNotificationSound = () => {
    if (document.hidden) {
      const audio = new Audio("/notif.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.log("Can't play notifciation sound");
      });
    }
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
    socket.on("disconnect", () => onDisconnect(socket));

    socket.on("open_chat_error", (msg) => {
      setOpenError(msg?.message || "Unknown error when opening chat");
    });

    socket.on("recv_message", (msg) => {
      if (!msg.name || !msg.message) return;
      const newMsg: ChatMessageData = {
        type: "received",
        ts: Number(msg.ts) || 0,
        name: msg.name.toString(),
        message: msg.message.toString(),
      };
      setMessages((currMsgs) => currMsgs.concat(newMsg));
      playNotificationSound();
    });

    socket.on("system_message", (msg) => {
      if (!msg.message) return;
      const newMsg: SystemMessageData = {
        type: "system",
        message: msg.message,
      };
      setMessages((currMsgs) => currMsgs.concat(newMsg));
      if (msg.message.includes("joined")) {
        playNotificationSound();
      }
    });

    socket.on("partner_metadata", (msg) => {
      if (!msg.name || !msg.role) return;
      setPartnerName("" + msg.name);
      setPartnerRole("" + msg.role);
    });

    return () => {
      socketRef.current!.disconnect();
    };
  }, []);

  return (
    <>
      <LoadingOverlay visible={isLoading && !openError} />

      <Paper
        p="xl"
        shadow="xs"
        className="bg-neutral-800 h-[100svh] overflow-hidden flex flex-col min-h-0"
      >
        {isLoading || openError ? null : (
          <Box className="flex w-full justify-between">
            <Box>
              <Box className="text-lg">{partnerName}</Box>
              <Box className="opacity-75">{partnerRole}</Box>
            </Box>
            {popOutLink ? (
              <Box className="flex h-full align-center">
                <a
                  href="/chat"
                  target="_blank"
                  className="inline-flex items-center"
                >
                  <IconExternalLink
                    className="w-5 h-5 align-middle"
                    aria-label="Open chat in new tab"
                    role="img"
                  />
                </a>
              </Box>
            ) : null}
          </Box>
        )}
        {isLoading || openError ? null : (
          <Box
            className="flex-1 overflow-auto min-h-20"
            ref={containerRef}
            onScroll={onScroll}
          >
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}
            <div ref={endOfMessagesRef} />
          </Box>
        )}
        {isLoading || openError ? null : (
          <Box className="shrink-0">
            <ComposeMessage sendMessage={sendMessage} disabled={!isActive} />
          </Box>
        )}
        {openError ? (
          <>
            <Title className="text-center pt-[30%]" order={1}>
              {openError}
            </Title>
          </>
        ) : null}
      </Paper>
    </>
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
  disabled: boolean;
}> = ({ sendMessage, disabled }) => {
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
            disabled={disabled}
            {...form.getInputProps("message")}
          />
          <ActionIcon type="submit" size="lg" disabled={disabled}>
            <IconSend />
          </ActionIcon>
        </Group>
      </form>
    </Box>
  );
};
