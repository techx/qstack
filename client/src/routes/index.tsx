import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Center,
  Transition,
} from '@mantine/core';
import { useToggle, upperFirst } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import * as auth from '../api/auth';
import { useUserStore } from '../hooks/useUserStore';
import { notifications } from '@mantine/notifications';

export default function IndexPage() {
  const navigate = useNavigate();
  const [name, email, getUser] = useUserStore((store) => [store.name, store.email, store.getUser]);

  useEffect(() => {
    getUser();
    console.log(name);
    if (name) navigate('/profile');
  }, [name]);

  // const handleSubmitPassword = async () => {
  //   const res = await auth.mpass(password);
  //   if (res.status) {
  //     notifications.show({
  //       title: res.message,
  //       color: 'green',
  //       message: 'You will be redirected shortly.',
  //     });
  //   } else {
  //     notifications.show({
  //       title: res.message,
  //       color: 'red',
  //       message: 'Please reach out to a HackMIT staff member.',
  //     });
  //   }
  // };

  return (
    <Container size="xs" my={150}>
      <Title align="center" size={'150'}>
        qstack
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
      {/* <Paper p="xl" mt="lg" >
        <Title align="center" size={'30'} weight={500}>
          i am a...
        </Title>
        <Group mt="md" grow>
          <Button onClick={() => window.location.replace(`/api/auth/login`)}>Hacker</Button>
          <Button onClick={() => toggle()}>Mentor</Button>
        </Group>

        <Transition mounted={value} transition="scale-y" duration={400} timingFunction="ease">
          {(styles) => (
            <TextInput
              style={{ ...styles }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Enter mentor password"
              placeholder="Password"
              mt="md"
              rightSection={<Button onClick={handleSubmitPassword}>Enter</Button>}
              rightSectionWidth={74}
            />
          )}
        </Transition>
      </Paper> */}
    </Container>
  );
}
