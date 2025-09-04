import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RichTextEditor } from "@mantine/tiptap";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as queue from "../api/queue";
import Chat from "../components/chat";
import classes from "./root.module.css";

interface ticket {
  id: number;
  question: string;
  content: string;
  tags: Array<string>;
  location: string;
  creator: string;
  active: boolean;
  name: string;
  discord: string;
  createdAt: Date;
  images: Array<string>;
}

interface displayContentProps {
  content: string;
}

function DisplayContent(props: displayContentProps) {
  const lowlight = createLowlight(all);

  const editor = useEditor({
    content: props.content,
    editable: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
  });

  return (
    <RichTextEditor className="border-none" editor={editor}>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}

export default function QueuePage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Array<ticket>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimed, setClaimed] = useState<number | undefined>(undefined);

  const getTickets = useCallback(() => {
    queue
      .getTickets()
      .then((res) => {
        if (res.ok) {
          const sortedTickets = res.tickets.sort((a: ticket, b: ticket) => {
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
          setTickets(sortedTickets);
          setLoading(false);
        } else {
          throw new Error("Tickets fetch failed");
        }
      })
      .catch((error) => {
        console.error(error);
        navigate("/error");
      });
  }, [setTickets, setLoading, navigate]);

  useEffect(() => {
    getTickets();
    const interval = setInterval(getTickets, 5000);
    return () => clearInterval(interval);
  }, [getTickets]);

  useEffect(() => {
    checkClaimed();
    const interval = setInterval(checkClaimed, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkClaimed = () => {
    queue.checkClaimed().then((res) => {
      if (res.ok && res.claimed) {
        setClaimed(parseInt(res.claimed));
      } else if (res.ok) {
        setClaimed(undefined);
      }
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showNotif = (res: any) => {
    if (res.ok) {
      notifications.show({
        title: "Success!",
        color: "green",
        message: res.message,
      });
    } else {
      notifications.show({
        title: "Error",
        color: "red",
        message: res.message,
      });
    }
  };

  const handleClaim = async (id: number) => {
    const res = await queue.claimTicket(id);
    showNotif(res);
    checkClaimed();
    getTickets();
  };

  const handleUnclaim = async (id: number) => {
    const res = await queue.unclaimTicket(id);
    showNotif(res);
    checkClaimed();
    getTickets();
  };

  const handleResolve = async (id: number, creator: string) => {
    const res = await queue.resolveTicket(id, creator);
    showNotif(res);
    checkClaimed();
    getTickets();
  };

  return (
    <Container size="md" py="6rem" h="100%">
      <LoadingOverlay visible={loading} />

      <Paper p="xl" shadow="xs" className="bg-neutral-800 h-full">
        {!claimed && (
          <Title className="text-center">
            Mentor Queue{" "}
            <Badge color="red" variant="light" size="xl">
              Tickets: {tickets.filter((ticket) => ticket.active).length}
            </Badge>
          </Title>
        )}

        {claimed && (
          <Title className="text-center">You have claimed a ticket!</Title>
        )}

        {claimed === undefined && (
          <Container className="mt-5" size="sm">
            {tickets.map(
              (ticket) =>
                ticket.active && (
                  <div key={ticket.id}>
                    <Card className="my-3">
                      <Group>
                        <Title order={2}>{ticket.question}</Title>
                      </Group>

                      <DisplayContent content={ticket.content} />
                      <Group>
                        {ticket.tags.map((tag) => (
                          <Badge key={tag} color="green">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                      <Group>
                        {
                          <div className={classes.previewContainer}>
                            {ticket.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Ticket Image ${index + 1}`}
                                style={{ maxWidth: "100%", margin: "10px 0" }}
                              />
                            ))}
                          </div>
                        }
                      </Group>
                      <div className="mt-5">
                        Hacker Name: <Badge>{ticket.creator ? ticket.creator : "No Name Provided"}</Badge>
                      </div>
                      <div className="mt-5">
                        Location: <Badge>{ticket.location}</Badge>
                      </div>
                      <div className="mt-5">
                        Discord:{" "}
                        <Badge>
                          {ticket.discord
                            ? ticket.discord
                            : "No Discord Provided"}
                        </Badge>
                      </div>

                      <div className="mt-5 text-md">
                        Ticket Created At:{" "}
                        <Badge size="lg">
                          {(() => {
                            const date = new Date(ticket.createdAt);
                            date.setSeconds(0, 0);
                            return date.toLocaleString();
                          })()}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleClaim(ticket.id)}
                        className="mt-5"
                      >
                        Claim
                      </Button>
                    </Card>
                  </div>
                )
            )}
          </Container>
        )}

        {claimed !== undefined && (
          <Container className="mt-5 h-full" size="sm">
            {tickets.map(
              (ticket) =>
                ticket.id == claimed && (
                  <Group key={ticket.id} h="100%" w="100%">
                    <Card className="my-3 h-full min-h-0" w="100%">
                      <Group>
                        <Title order={2}>{ticket.question}</Title>
                      </Group>

                      <DisplayContent content={ticket.content} />
                      <Group>
                        {ticket.tags.map((tag) => (
                          <Badge key={tag} color="green">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                      <Group>
                        {
                          <div className={classes.previewContainer}>
                            {ticket.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Ticket Image ${index + 1}`}
                                style={{ maxWidth: "100%", margin: "10px 0" }}
                              />
                            ))}
                          </div>
                        }
                      </Group>
                      <div className="mt-5">
                        Hacker Name: <Badge>{ticket.creator ? ticket.creator : "No Name Provided"}</Badge>
                      </div>
                      <div className="mt-5">
                        Location: <Badge>{ticket.location}</Badge>
                      </div>
                      <div className="mt-5">
                        Discord:{" "}
                        <Badge>
                          {ticket.discord
                            ? ticket.discord
                            : "No Discord Provided"}
                        </Badge>
                      </div>
                      <Box className="h-full w-full flex flex-col min-h-0">
                        <Chat popOutLink={true} />
                      </Box>
                      <Group className="mt-5" grow>
                        <Button
                          onClick={() =>
                            handleResolve(ticket.id, ticket.creator)
                          }
                        >
                          Mark as Resolved
                        </Button>
                        <Button
                          color="red"
                          onClick={() => handleUnclaim(ticket.id)}
                        >
                          Unclaim
                        </Button>
                      </Group>
                    </Card>
                  </Group>
                )
            )}
          </Container>
        )}
      </Paper>
    </Container>
  );
}
