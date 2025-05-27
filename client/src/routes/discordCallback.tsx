import { useEffect, useState } from "react";
import { Container, Title, Loader, Text, Anchor } from "@mantine/core";

export default function DiscordCallback() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Connecting Discord...");

  useEffect(() => {
    const handleDiscordCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus("error");
        setMessage(`Discord connection failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received from Discord");
        return;
      }

      try {
        const response = await fetch('/api/auth/discord/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage(`Discord connected: ${data.discord_tag}`);
          setTimeout(() => {
            window.location.href = '/home';
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || data.message || "Discord connection failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Network error during Discord connection");
        console.error('Discord error:', error);
      }
    };

    handleDiscordCallback();
  }, []);

  return (
    <Container size="xs" className="h-full">
      <div className="pt-[40%] text-center">
        {status === "processing" && (
          <>
            <Loader size="lg" mb="md" />
            <Title order={3}>{message}</Title>
          </>
        )}
        {status === "success" && (
          <>
            <Title order={3} className="text-green-500">Success!</Title>
            <Text mt="md">{message}</Text>
            <Text mt="sm" size="sm" className="text-gray-400">Redirecting...</Text>
          </>
        )}
        {status === "error" && (
          <>
            <Title order={3} className="text-red-500">Connection Failed</Title>
            <Text mt="md">{message}</Text>
            <Text mt="md">
              <Anchor href="/home">Back to Home</Anchor>
            </Text>
          </>
        )}
      </div>
    </Container>
  );
}
