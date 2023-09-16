
import {
    Container,
    Title,
    Center,
    Button
  } from "@mantine/core";

export default function NotFoundPage() {
    return (
        <Container size="xs" className="h-full">
        <Title className="text-center pt-[30%]" size={"150"}>
          oops!
        </Title>
        <Center>
          <Button
            onClick={() => window.location.replace("/")}
            fullWidth
            size="md"
            mt="md"
          >
            Return Home
          </Button>
        </Center>
      </Container>
    )
}