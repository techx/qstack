import { Paper, Text, Title, Container, Anchor, Button, Group, Badge } from "@mantine/core";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and fetch their info
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/whoami', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.loggedIn) {
            setUser(userData);
            if (!userData.discord) {
              window.location.href = '/api/auth/discord/login';
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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

        <Text className="text-2xl mt-5">Discord Connection</Text>

        {loading ? (
          <Text>Checking connection status...</Text>
        ) : user && user.loggedIn ? (
          user.discord ? (
            <Paper p="md" className="bg-neutral-700" mb="md">
              <Group>
                <div style={{ flex: 1 }}>
                  <Group spacing="xs">
                    <Text weight={500}>{user.discord}</Text>
                    <Badge color="green" size="sm">Connected</Badge>
                  </Group>
                  <Text size="sm" color="dimmed">
                    Mentors can reach you via Discord
                  </Text>
                </div>
              </Group>
            </Paper>
          ) : (
            <>
              <Text mb="sm">Connecting Discord...</Text>
            </>
          )
        ) : (
          <Text>Please log in to connect your Discord account.</Text>
        )}

        <Text className="text-2xl mt-5">More questions?</Text>
        <Text>
          Visit our helpdesk or email us at <span></span>
          <Anchor href="mailto:help@hackmit.org" target="_blank">
            help@hackmit.org
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
