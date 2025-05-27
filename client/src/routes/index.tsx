import { Title, Container, Button, Center } from "@mantine/core";
import { useEffect } from "react";

import { useUserStore } from "../hooks/useUserStore";

export default function IndexPage() {
  const loggedIn = useUserStore((store) => store.loggedIn);
  useEffect(() => {
    if (loggedIn) window.location.replace("/home");
  }, [loggedIn]);

  return (
    <Container size="xs" className="h-full">
      <Title className="text-center pt-[40%]" size={"100"}>
        qstack
      </Title>
      <Title className="italic text-center text-lg">
        HackMIT's help queue platform!
      </Title>
      <Center>
        <Button
          onClick={() => window.location.replace(`/api/auth/login`)}
          fullWidth
          size="md"
          mt="md"
        >
          Enter
        </Button>
      </Center>
    </Container>
  );
}
