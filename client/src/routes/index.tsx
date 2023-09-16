import { Title, Container, Button, Center } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useUserStore } from "../hooks/useUserStore";

export default function IndexPage() {
  const navigate = useNavigate();
  const [name, getUser] = useUserStore((store) => [store.name, store.getUser]);

  useEffect(() => {
    getUser();
    if (name) navigate("/home");
  }, [name]);

  return (
    <Container size="xs" className="h-full">
      <Title className="text-center pt-[30%]" size={"150"}>
        qstack
      </Title>
      <Title className="italic text-center text-lg">HackMIT's help queue platform!</Title>
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
