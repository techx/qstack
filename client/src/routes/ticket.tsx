import {
  Badge,
  Button,
  Container,
  Flex,
  Group,
  HoverCard,
  LoadingOverlay,
  Paper,
  Rating,
  rem,
  Space,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { RichTextEditor } from "@mantine/tiptap";
import { IconPhoto, IconUpload } from "@tabler/icons-react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extensions";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import { useCallback, useEffect, useState } from "react";
import * as ticket from "../api/ticket";
import ChatRoomModal from "./chatRoomModal.tsx"; // Import the modal component
import classes from "./root.module.css";

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
  images: Array<string>;
}

export default function TicketPage() {
  const [question, setQuestion] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [images, setImages] = useState<Array<string>>([]);

  const [tags, setTags] = useState<Array<string>>([]);
  const [tagsList, setTagsList] = useState<Array<string>>([]);
  const [active, setActive] = useState<boolean | undefined>(undefined);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [mentorData, setMentorData] = useState<mentor>();
  const lowlight = createLowlight(all);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState<boolean>(false);
  const [ratings, setRatings] = useState<Map<number, number>>(
    new Map<number, number>()
  );
  const [reviews, setReviews] = useState<Map<number, string>>(
    new Map<number, string>()
  );

  const [resolvedTickets, setResolvedTickets] = useState<Array<ticket>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        CodeBlockLowlight.configure({
          lowlight,
        }),
        Placeholder.configure({ placeholder: "How do I write hello world?" }),
      ],
      content: content,
      editable: !active,
      onUpdate({ editor }) {
        const htmlContent = editor.getHTML();
        const sanitizedHTML = htmlContent.replace(/ +/g, "&nbsp;");
        setContent(sanitizedHTML);
      },
    },
    [active]
  );

  const getStatus = useCallback(async () => {
    const res = await ticket.getStatus();
    if (res.ok && res.status === "claimed") {
      if (!claimed) {
        setClaimed(true);
        if (!soundPlayed) {
          const playSound = () => {
            const audio = new Audio("/notif.mp3");
            audio.play();
          };
          playSound();
          setSoundPlayed(true);
          notifications.show({
            title: "Ticket Claimed!",
            message: "Your ticket has been claimed!",
            color: "green",
          });
        }
      }
      setMentorData(res.mentorData);
    } else if (res.ok && res.status === "unclaimed") {
      setSoundPlayed(false);
      setClaimed(false);
      setMentorData(undefined);
    } else if (res.ok && res.status === "awaiting_feedback") {
      setSoundPlayed(false);
      setClaimed(false);
      setMentorData(res.mentorData);
    }
  }, [claimed, setClaimed, setMentorData, soundPlayed]);

  const getTicket = useCallback(() => {
    ticket.getTicket().then((res) => {
      if (res.active || res.ticket) {
        setActive(true);
        setQuestion(res.ticket.question);
        setContent(res.ticket.content);
        setLocation(res.ticket.location);
        setTags(res.ticket.tags);
        setImages(res.ticket.images);
      }
      if (!res.ticket) {
        setQuestion("");
        setContent("");
        if (editor) {
          editor.commands.setContent("");
        }
        setLocation("");
        setTags([]);
        setImages([]);
      }
      if (!res.active) setActive(false);
    });
  }, [
    setActive,
    setQuestion,
    setContent,
    setLocation,
    setTags,
    setImages,
    editor,
  ]);

  useEffect(() => {
    ticket.getTags().then((res) => setTagsList(res.tags));
    getTicket();
  }, [getTicket]);

  useEffect(() => {
    getStatus();
    const interval = setInterval(getStatus, 5000);
    return () => clearInterval(interval);
  }, [soundPlayed, getStatus]);

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

  const handleRatingChange = (ticketId: number, rating: number) => {
    setRatings((prevRatings) => {
      const newRatings = new Map(prevRatings);
      newRatings.set(ticketId, rating);
      return newRatings;
    });
  };

  const handleReviewChange = (ticketId: number, review: string) => {
    setReviews((prevReviews) => {
      const newReviews = new Map(prevReviews);
      newReviews.set(ticketId, review);
      return newReviews;
    });
  };

  const submitRating = async (ratedTicket: ticket) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const rating = ratings.get(ratedTicket.id) as number;
    const review = reviews.get(ratedTicket.id) || "";
    const res = await ticket.rate(
      ratedTicket.id,
      ratedTicket.mentor_id,
      rating,
      review
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      images: images,
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
      images: images,
    });
    if (res.ok) {
      sessionStorage.setItem("chatName", "default name"); // Ensure this line is present

      getTicket();
      setIsModalOpen(true);
    }
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

  const handleDrop = async (newFiles: Array<FileWithPath>) => {
    const newImages: Array<string> = (await Promise.all(
      newFiles.map((file) => fileToBase64(file))
    )) as Array<string>;
    setImages((prevImages: Array<string>) => [...prevImages, ...newImages]);
  };

  const fileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeImage = (imageToRemove: string) => {
    if (!active) {
      setImages(images.filter((image: string) => image !== imageToRemove));
    }
  };

  const previews = (
    images: Array<string>,
    removeImage: (file: string) => void
  ) => {
    if (images.length === 0) {
      return <Group></Group>;
    }
    return images.map((image, index) => (
      <div key={index}>
        <img src={image} alt={`image-${index}`} />
        <button
          style={{ position: "absolute", top: 0, right: 0 }}
          onClick={() => removeImage(image)}
        >
          X
        </button>
      </div>
    ));
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
                    ? "Your ticket is currently in queue. A mentor will be with you shortly! Turn on your sound -- this page will make a sound when a mentor claims your ticket."
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
            label="How can we find you? During official hacking hours, please put your Johnson Ice Rink table number. If you are requesting help outside of official hacking hours, your mentor will be virtual. Also, a reminder to please fill out your discord on your profile if you haven’t already to ensure that your mentor can contact you."
            placeholder="red shirt guy at table 3"
          />
          <Space></Space>
          <Flex justify="center" gap={30} wrap="wrap">
            <Dropzone
              onDrop={handleDrop}
              maxSize={5 * 528 ** 2}
              accept={IMAGE_MIME_TYPE}
              className={classes.dropzone}
              h={200}
              w={520}
              disabled={active}
              onReject={() =>
                notifications.show({
                  title: "Error",
                  message:
                    "Failed to upload image. Check that your image is less than 3MB.",
                  color: "red",
                })
              }
            >
              <Group grow justify="center" gap="l">
                <Dropzone.Accept>
                  <IconUpload
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-blue-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Idle>
                  {images.length === 0 && (
                    <IconPhoto
                      style={{
                        width: rem(52),
                        height: rem(52),
                        color: "var(--mantine-color-dimmed)",
                      }}
                      stroke={1.5}
                    />
                  )}
                </Dropzone.Idle>

                {images.length !== 0 && (
                  <div className={classes.previewContainer}>
                    {previews(images, removeImage)}
                  </div>
                )}
                <Text size="l" inline ta="center">
                  Drag any images here to give more context to your problem!
                </Text>
              </Group>
            </Dropzone>
          </Flex>

          {!active && (
            <Group grow>
              <Button onClick={() => handleSave()} className="mt-5">
                Save
              </Button>
              <Button onClick={() => handleSubmit()} className="mt-5">
                Submit
              </Button>
              {/* Render the modal only if isModalOpen is true */}
              {isModalOpen && (
                <ChatRoomModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                />
              )}
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
              <a
                href={
                  mentorData.zoomlink.startsWith("http")
                    ? mentorData.zoomlink
                    : `https://${mentorData.zoomlink}`
                }
              >
                {mentorData.zoomlink}
              </a>
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
              onChange={(rating) => handleRatingChange(ticket.id, rating)}
              value={ratings.get(ticket.id) || 0}
              fractions={2}
              size="lg"
              color="yellow"
            />
            <Textarea
              placeholder="Leave a review..."
              value={reviews.get(ticket.id) || ""}
              onChange={(event) =>
                handleReviewChange(ticket.id, event.target.value)
              }
              minRows={4}
              style={{ width: "100%", maxWidth: "80%" }}
            />
            <Button onClick={() => submitRating(ticket)} color="yellow">
              Submit Rating
            </Button>
          </div>
        </Paper>
      ))}
    </Container>
  );
}
