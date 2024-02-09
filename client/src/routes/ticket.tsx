import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  TagsInput,
  Button,
  LoadingOverlay,
  Group,
  Badge,
  HoverCard,
  Rating,
} from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import * as ticket from "../api/ticket";
import * as queue from "../api/queue";
import { notifications } from "@mantine/notifications";

interface mentor {
  name: string;
  location: string;
  zoomlink: string;
  discord: string;
  id: number;
}

interface ticket {
  id: number;
  creator: string;
  mentor_id: number;
  mentor_name: string;
  rating: number;
  question: string;
}

export default function TicketPage() {
  const [question, setQuestion] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const [tags, setTags] = useState<Array<string>>([]);
  const [tagsList, setTagsList] = useState<Array<string>>([]);
  const [active, setActive] = useState<boolean | undefined>(undefined);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [mentorData, setMentorData] = useState<mentor>();
  const lowlight = createLowlight(all);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resolvedTickets, setResolvedTickets] = useState<Array<ticket>>([]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        Link,
        CodeBlockLowlight.configure({
          lowlight,
        }),
        Placeholder.configure({ placeholder: "How do I write hello world?" }),
      ],
      content: content,
      editable: !active,
      onUpdate({ editor }) {
        setContent(editor.getHTML());
      },
    },
    [active]
  );

  const getStatus = async () => {
    const res = await ticket.getStatus();
    if (res.ok && res.status == "claimed") {
      setClaimed(true);
      setMentorData(res.mentorData);
    } else if (res.ok && res.status == "unclaimed") {
      setClaimed(false);
      setMentorData(undefined);
    } else if (res.ok && res.status == "awaiting_feedback") {
      setClaimed(false);
      setMentorData(res.mentorData);
    }
  };

  useEffect(() => {
    ticket.getTags().then((res) => setTagsList(res.tags));
    getTicket();
  }, []);

  useEffect(() => {
    getStatus();
    const interval = setInterval(getStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkForResolvedTickets();
    const intervalId = setInterval(checkForResolvedTickets, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);  

  const checkForResolvedTickets = async () => {
    const res = await ticket.getFeedback();
    if (res.ok && res.tickets.length > 0) {
      setResolvedTickets(res.tickets);
    } else {
      setResolvedTickets([]);
    }
  };

  const submitRating = async (ratedTicket: ticket, rating: number) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const res = await ticket.rate(
      ratedTicket.id,
      ratedTicket.mentor_id,
      rating
    );
    if (res.ok) {
      notifications.show({
        title: "Rating Submitted",
        message: "Thank you for your feedback!",
        color: "green",
      });
      getTicket();
      getStatus();
      checkForResolvedTickets();
    } else {
      notifications.show({
        title: "Error",
        message: "Failed to submit rating. Please try again.",
        color: "red",
      });
    }
    setIsSubmitting(false);
  };

  const getTicket = () => {
    ticket.getTicket().then((res) => {
      if (res.active || res.ticket) {
        setActive(true);
        setQuestion(res.ticket.question);
        setContent(res.ticket.content);
        setLocation(res.ticket.location);
        setTags(res.ticket.tags);
      }
      if (!res.ticket) {
        setQuestion("");
        setContent("");
        if (editor) {
          editor.commands.setContent("");
        }
        setLocation("");
        setTags([]);
      }
      if (!res.active) setActive(false);
    });
  };

  const showNotif = (res: any) => {
    if (res.ok) {
      notifications.show({
        title: "Success!",
        color: "green",
        message: res.message,
      });
      getTicket();
    } else {
      notifications.show({
        title: "Error",
        color: "red",
        message: res.message,
      });
    }
  };

  const handleSave = async () => {
    const res = await ticket.save({
      question: question,
      content: content,
      location: location,
      tags: tags,
    });
    showNotif(res);
  };

  const handleUnclaim = async () => {
    const res = await ticket.unclaim();
    showNotif(res);
    if (res.ok) {
      setClaimed(false);
    }
  };
  const handleSubmit = async () => {
    const res = await ticket.submit({
      question: question,
      content: content,
      location: location,
      tags: tags,
    });
    if (res.ok) getTicket();
    showNotif(res);
  };

  const handleEdit = async (del: boolean = false) => {
    const res = await ticket.remove(del);
    showNotif(res);
    getTicket();
  };

  const handleResolve = async (mentor_id: number) => {
    const res = await ticket.resolve(mentor_id);
    showNotif(res);
    checkForResolvedTickets();
    getStatus();
    getTicket();
  };

  return (
    <Container size="sm" py="6rem" pb="10rem">
      <LoadingOverlay visible={active == undefined} />

      {!claimed && resolvedTickets.length === 0 && (
        <Paper p="xl" shadow="xs" className="bg-neutral-800">
          <Title className="text-center">
            How can we help you?{" "}
            <HoverCard width={280} shadow="md" withArrow>
              <HoverCard.Target>
                <Badge
                  variant="light"
                  color={active ? "green" : "blue"}
                  size="xl"
                >
                  {active ? "Ticket Active" : "Edit Mode"}
                </Badge>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Text size="sm">
                  {active
                    ? "Your ticket is currently in queue. A mentor will be with you shortly!"
                    : "Your ticket is currently in edit mode. To submit to queue, click on the submit button!"}
                </Text>
              </HoverCard.Dropdown>
            </HoverCard>
          </Title>

          <TextInput
            disabled={active}
            value={question}
            onChange={(e) => setQuestion(e.currentTarget.value)}
            size="md"
            mt="lg"
            label="Describe your problem in one sentence"
            placeholder="What is python?"
          />
          <Text className="cursor-default select-none" size="md" mt="lg">
            Include any additional details or code snippets
          </Text>
          <RichTextEditor editor={editor}>
            <RichTextEditor.Toolbar>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.CodeBlock />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Underline />
                <RichTextEditor.Strikethrough />
                <RichTextEditor.ClearFormatting />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Hr />
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Link />
                <RichTextEditor.Unlink />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            <RichTextEditor.Content
              className={active ? "hover:cursor-not-allowed" : ""}
              style={{
                minHeight: "10rem",
                backgroundColor: "var(--mantine-color-dark-7)",
              }}
            />
          </RichTextEditor>

          <TagsInput
            disabled={active}
            mt="md"
            label="Enter any tags"
            data={tagsList}
            limit={5}
            value={tags}
            onChange={setTags}
          />
          <TextInput
            disabled={active}
            onChange={(e) => setLocation(e.currentTarget.value)}
            value={location}
            size="md"
            mt="lg"
            label="How can we find you?"
            placeholder="red shirt guy at table 3"
          />

          {!active && (
            <Group grow>
              <Button onClick={() => handleSave()} className="mt-5">
                Save
              </Button>
              <Button onClick={() => handleSubmit()} className="mt-5">
                Submit
              </Button>
            </Group>
          )}
          {active && (
            <Group grow>
              <Button onClick={() => handleEdit()} className="mt-5">
                Edit
              </Button>
              <Button
                color="red"
                onClick={() => handleEdit(true)}
                className="mt-5"
              >
                Delete
              </Button>
            </Group>
          )}
        </Paper>
      )}

      {claimed && mentorData && (
        <Paper p="xl" shadow="xs" className="bg-neutral-800">
          <Title className="text-center">Your ticket has been claimed!</Title>

          <Text className="mt-10 text-lg">
            Mentor Name: <Badge size="lg">{mentorData.name}</Badge>
          </Text>
          <Text className="mt-5 text-md">
            Mentor Discord Contact:{" "}
            <Badge size="lg" color="green" variant="light">
              {mentorData.discord}
            </Badge>
          </Text>
          {mentorData.location == "in person" && (
            <Text className="mt-5 text-lg">
              Your mentor should be with you shortly!
            </Text>
          )}
          {mentorData.location == "virtual" && (
            <Text className="mt-5 text-lg">
              Your mentor is virtual! <br /> Please join their video call link:{" "}
              <a href={mentorData.zoomlink}>{mentorData.zoomlink}</a>
            </Text>
          )}

          <Group grow className="mt-5">
            <Button onClick={() => handleResolve(mentorData.id)}>
              Mark as Resolved
            </Button>
            <Button color="red" onClick={() => handleUnclaim()}>
              Return to Queue
            </Button>
          </Group>
        </Paper>
      )}

      {resolvedTickets.map((ticket) => (
        <Paper
          key={ticket.id}
          p="xl"
          shadow="xs"
          className="bg-neutral-800"
          radius="md"
          withBorder
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <Title className="text-center" style={{ color: "#FFF" }}>
              Rate Your Mentor: {ticket.mentor_name}
            </Title>
            <Text
              style={{ color: "#DDD", textAlign: "center", maxWidth: "80%" }}
            >
              Please rate the support provided by your mentor for the ticket: "
              {ticket.question}"
            </Text>
            <Rating
              onChange={(rating) => submitRating(ticket, rating)}
              value={0}
              fractions={2}
              size="lg"
              color="yellow" 
            />
          </div>
        </Paper>
      ))}
    </Container>
  );
}
