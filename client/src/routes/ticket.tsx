import { useUserStore } from '../hooks/useUserStore';
import { useEffect, useState } from 'react';
import { Container, Paper, Title, Text, TextInput, TagsInput } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import * as ticket from '../api/ticket';

export default function TicketPage() {
  const [name, email, getUser] = useUserStore((store) => [store.name, store.email, store.getUser]);
  const [tagsList, setTagsList] = useState([]);
  const lowlight = createLowlight(all);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({placeholder: "How do I write hello world?"})
    ],
    content: ``,
  });

  useEffect(() => {
    getUser();
    ticket.getTags().then((res) => setTagsList(res));
  }, []);

  return (
    <Container size="sm" py="6rem" pb="10rem">
      <Paper
        p="xl" shadow="xs" className="bg-neutral-800"
      >
        <Title>How can we help you?</Title>

        
        <TextInput size="md" mt="lg" label="Describe your problem in once sentence" placeholder="What is python?"/>
        <Text size="md" mt="lg">
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

          <RichTextEditor.Content style={{minHeight: "10rem", backgroundColor: "var(--mantine-color-dark-8)"}}/>
        </RichTextEditor>

        <TagsInput mt="md" label="Enter any tags" data={tagsList} limit={5}/>
      </Paper>
    </Container>
  );
}