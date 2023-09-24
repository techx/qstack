import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";

import { useEffect } from "react";
import { useUserStore } from "./hooks/useUserStore";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import NotFoundPage from "./routes/notFound";
import IndexPage from "./routes/index";
import ProfilePage from "./routes/profile";
import TicketPage from "./routes/ticket";
import QueuePage from "./routes/queue";
import HomePage from "./routes/home";
import HeaderNav from "./components/header";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={window.location.pathname != "/" && <HeaderNav />}
      errorElement={<NotFoundPage />}
    >
      <Route index path="/" element={<IndexPage />} />
      <Route index path="/home" element={<HomePage />} />
      <Route index path="/profile" element={<ProfilePage />} />
      <Route index path="/ticket" element={<TicketPage />} />
      <Route index path="/queue" element={<QueuePage />} />
    </Route>,
  ),
);

export default function App() {
  const getUser = useUserStore((store) => store.getUser);
  useEffect(() => {
    getUser();
  }, []);
  return <RouterProvider router={router} />;
}
