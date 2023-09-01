import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';

import NotFoundPage from './routes/notFound';
import IndexPage from './routes/index';
import ProfilePage from './routes/profile';
import CreatePage from './routes/create';
import TicketsPage from './routes/tickets';
import HeaderNav from './components/header';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<NotFoundPage />} element={<HeaderNav />}>
      <Route index path="/" element={<IndexPage />} />
      <Route index path="/profile" element={<ProfilePage />} />
      <Route index path="/create" element={<CreatePage />} />
      <Route index path="/tickets" element={<TicketsPage />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
