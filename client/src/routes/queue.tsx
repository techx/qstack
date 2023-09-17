import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Title,
  Card,
  Group,
  Badge,
  Text,
  Button,
  LoadingOverlay,
} from "@mantine/core";
import * as queue from "../api/queue";
import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import { all, createLowlight } from "lowlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import StarterKit from "@tiptap/starter-kit";
import { notifications } from "@mantine/notifications";

interface ticket {
  id: number;
  question: string;
  content: string;
  tags: Array<string>;
  location: string;
  creator: string;
  active: boolean;
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
      StarterKit,
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

export default function queuePage() {
  const [tickets, setTickets] = useState<Array<ticket>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimed, setClaimed] = useState<number | undefined>(undefined);

  useEffect(() => {
    getTickets();
    const interval = setInterval(getTickets, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const getTickets = () => {
    queue.getTickets().then((res) => {
      if (res.ok) {
        setTickets(res.tickets);
        setLoading(false);
      }
    });
  };

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

  const handleResolve = async (id: number) => {
    const res = await queue.resolveTicket(id);
    showNotif(res);
    checkClaimed();
    getTickets();
  };

  return (
    <Container size="md" py="6rem">
      <LoadingOverlay visible={loading} />

      <Paper p="xl" shadow="xs" className="bg-neutral-800">
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

        {claimed == undefined && (
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
                      <Text className="mt-5">
                        Location: <Badge>{ticket.location}</Badge>
                      </Text>
                      <Button
                        onClick={() => handleClaim(ticket.id)}
                        className="mt-5"
                      >
                        Claim
                      </Button>
                    </Card>
                  </div>
                ),
            )}
          </Container>
        )}

        {claimed != undefined && (
          <Container className="mt-5" size="sm">
            {tickets.map(
              (ticket) =>
                ticket.id == claimed && (
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
                      <Text className="mt-5">
                        Location: <Badge>{ticket.location}</Badge>
                      </Text>
                      <Group className="mt-5" grow>
                        <Button onClick={() => handleResolve(ticket.id)}>
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
                  </div>
                ),
            )}
          </Container>
        )}
      </Paper>
    </Container>
  );
}
