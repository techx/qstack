import { useUserStore } from "../hooks/useUserStore";
import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  TextInput,
  Group,
  Button,
  Text,
  Checkbox,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import * as auth from "../api/auth";

export default function ProfilePage() {
  const [name, email, role, location, zoomlink, getUser, discord] =
    useUserStore((store) => [
      store.name,
      store.email,
      store.role,
      store.location,
      store.zoomlink,
      store.getUser,
      store.discord,
    ]);

  const [user, updateUser] = useState<auth.UserInfo>({
    name: name,
    email: email,
    role: role,
    location: location,
    zoomlink: zoomlink,
    password: "",
    discord: discord,
  });

  useEffect(() => {
    updateUser({
      name: name,
      email: email,
      role: role,
      location: location,
      zoomlink: zoomlink,
      password: "",
      discord: discord,
    });
  }, [name]);

  const handleUserUpdate = async () => {
    const res = await auth.updateUser(user);
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
    getUser();
  };

  return (
    <Container size="sm" py="6rem">
      <Paper p="xl" shadow="xs" className="bg-neutral-800">
        <Group grow>
          <TextInput
            label="Name"
            size="md"
            value={user.name}
            onChange={(e) => updateUser({ ...user, name: e.target.value })}
          />
          <TextInput
            disabled
            label="Email"
            size="md"
            width={300}
            value={user.email}
          />
          <TextInput
            label="Discord"
            size="md"
            value={user.discord}
            onChange={(e) => updateUser({ ...user, discord: e.target.value })}
          />
        </Group>
        <Text className="text-weight-500" mt="lg">
          User Role
        </Text>
        <Group>
          <Checkbox
            size="md"
            checked={user.role == "hacker"}
            onChange={() => updateUser({ ...user, role: "hacker" })}
            label={"Hacker"}
          />
          <Checkbox
            size="md"
            checked={user.role == "mentor"}
            onChange={() => updateUser({ ...user, role: "mentor" })}
            label={"Mentor"}
          />
        </Group>
        {user.role == "mentor" && role == "hacker" && (
          <TextInput
            value={user.password}
            onChange={(e) => updateUser({ ...user, password: e.target.value })}
            label="Enter mentor password"
            placeholder="Password"
            mt="md"
          />
        )}

        {user.role === "mentor" && role === "mentor" && (
          <>
            <Text className="text-weight-500" mt="lg">
              Location
            </Text>
            <Group>
              <Checkbox
                size="md"
                checked={user.location == "in person"}
                onChange={() => updateUser({ ...user, location: "in person" })}
                label={"In Person"}
              />
              <Checkbox
                size="md"
                checked={user.location == "virtual"}
                onChange={() => updateUser({ ...user, location: "virtual" })}
                label={"Virtual"}
              />
            </Group>
          </>
        )}

        {user.location === "virtual" &&
          user.role === "mentor" &&
          role === "mentor" && (
            <TextInput
              value={user.zoomlink}
              onChange={(e) =>
                updateUser({ ...user, zoomlink: e.target.value })
              }
              label="Enter a zoom or a video call link for hackers to join!"
              mt="md"
            />
          )}

        <Button onClick={handleUserUpdate} className="mt-5">
          Update
        </Button>
      </Paper>
    </Container>
  );
}
