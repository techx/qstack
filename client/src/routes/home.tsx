import { Paper, Text, Title, Container, Anchor } from "@mantine/core";

export default function HomePage() {
  return (
    <Container size="sm" py="6rem">
      <Paper p="xl" shadow="xs" className="bg-neutral-800">
        <Title className="text-center">Welcome to qstack!</Title>

        <Text className="text-2xl mt-5">How do I use qstack?</Text>
        <Text>
          For hackers, simply visit the Ticket page to create your help ticket!
          Mentors will be able to either visit you at your location or provide a
          zoom link.
        </Text>
        <Text>
          For mentors, enter the mentor password in the Profile page to gain
          access to the help queue. You can then claim tickets under the Queue
          page.
        </Text>

        <Text className="text-2xl mt-5">More questions?</Text>

        <Text>Visit our helpdesk or email us at <span></span>
          <Anchor href="mailto:help@hackmit.org" target="_blank">
               help@hackmit.org
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
