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

import HeaderNav from "./components/header";
import DiscordCallback from "./routes/discordCallback";
import AdminPanel from "./routes/admin";
import ChatPage from "./routes/chat";
import HomePage from "./routes/home";
import IndexPage from "./routes/index";
import Leaderboard from "./routes/leaderboard";
import NotFoundPage from "./routes/notFound";
import ProfilePage from "./routes/profile";
import QueuePage from "./routes/queue";
import TicketPage from "./routes/ticket";

// TODO: FIX CHATROOM THING I DONT KNOW IF WE EVEN SUPPOSED TO HAVE ONE
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={window.location.pathname !== "/" && <HeaderNav />}
      errorElement={<NotFoundPage />}
    >
      <Route index path="/" element={<IndexPage />} />
      <Route index path="/home" element={<HomePage />} />
      <Route index path="/profile" element={<ProfilePage />} />
      <Route index path="/ticket" element={<TicketPage />} />
      <Route index path="/queue" element={<QueuePage />} />
      <Route index path="/leaderboard" element={<Leaderboard />} />
      <Route index path="/chat" element={<ChatPage />} />
      <Route index path="/stats" element={<AdminPanel />} />
      <Route path="/auth/discord/callback" element={<DiscordCallback />} />
    </Route>
  )
);

export default function App() {
  const [getUser, loggedIn] = useUserStore((store) => [
    store.getUser,
    store.loggedIn,
  ]);
  if (loggedIn == false && window.location.pathname != "/")
    window.location.replace("/");
  useEffect(() => {
    getUser();
  }, [getUser]);
  return <RouterProvider router={router} />;
}
