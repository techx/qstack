import "@mantine/core/styles.css";
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

// import NotFoundPage from './routes/notFound';
import IndexPage from "./routes/index";
import ProfilePage from "./routes/profile";
import TicketPage from './routes/ticket';
// import QueuePage from './routes/queue';
import HeaderNav from "./components/header";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<HeaderNav />}>
      <Route index path="/" element={<IndexPage />} />
      <Route index path="/profile" element={<ProfilePage />} />
      <Route index path="/ticket" element={<TicketPage />} />
      {/* <Route index path="/queue" element={<QueuePage />} />  */}
    </Route>,
  ),
);

export default function App() {
  return (
    <RouterProvider router={router} />
  );
}
