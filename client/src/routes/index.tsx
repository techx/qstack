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

export default function IndexPage() {
  const navigate = useNavigate();
  const [name, email, getUser] = useUserStore((store) => [store.name, store.email, store.getUser]);

  useEffect(() => {
    getUser();
    console.log(name);
    if (name) navigate('/profile');
  }, [name]);

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
    </Container>
  );
}
