import { useUserStore } from '../hooks/useUserStore';
import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  TextInput,
  Group,
  Title,
  Button,
  Text,
  Checkbox,
  Transition,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import * as auth from '../api/auth';

export default function profilePage() {
  const [name, email, role, getUser] = useUserStore((store) => [
    store.name,
    store.email,
    store.role,
    store.getUser,
  ]);
  const [user, updateUser] = useState<auth.UserInfo>({
    name: name,
    email: email,
    role: role,
    password: '',
  });

  useEffect(() => {
    getUser();
    updateUser({ name: name, email: email, role: role, password: '' });
  }, [name]);

  const handleUserUpdate = async () => {
    const res = await auth.updateUser(user);
    if (res.status) {
      notifications.show({
        title: 'Success!',
        color: 'green',
        message: res.message,
      });
    } else {
      notifications.show({
        title: 'Error',
        color: 'red',
        message: res.message,
      });
    }
    getUser();
  };
  return (
    <Container size="sm" py="lg">
      <Paper
        sx={(theme) => ({ backgroundColor: theme.colors.dark[6], height: '50%', borderRadius: 20 })}
        p="xl"
        shadow="xs"
      >
        <Title align="center">Profile</Title>

        <Group mt="lg" grow>
          <TextInput
            label="Name"
            size="md"
            value={user.name}
            onChange={(e) => updateUser({ ...user, name: e.target.value })}
          />
          <TextInput disabled label="Email" size="md" width={300} value={user.email} />
        </Group>
        <Text weight={500} mt="lg">
          User Role
        </Text>
        <Group>
          <Checkbox
            size="md"
            checked={user.role == 'hacker'}
            onChange={() => updateUser({ ...user, role: 'hacker' })}
            label={'Hacker'}
          />
          <Checkbox
            size="md"
            checked={user.role == 'mentor'}
            onChange={() => updateUser({ ...user, role: 'mentor' })}
            label={'Mentor'}
          />
        </Group>
        {user.role == 'mentor' && role == 'hacker' && (
          <TextInput
            value={user.password}
            onChange={(e) => updateUser({ ...user, password: e.target.value })}
            label="Enter mentor password"
            placeholder="Password"
            mt="md"
          />
        )}

        <Button onClick={handleUserUpdate} mt="lg">
          Update
        </Button>
      </Paper>
    </Container>
  );
}
