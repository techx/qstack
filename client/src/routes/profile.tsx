import { useUserStore } from '../hooks/useUserStore';
import { useEffect } from 'react';

export default function profilePage() {
  const [name, email, getUser] = useUserStore((store) => [store.name, store.email, store.getUser]);

  useEffect(() => {
    getUser();
  }, []);

  return <>{email}</>;
}
