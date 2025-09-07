import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Notifications } from "@mantine/notifications";
import "./index.css";
import { MantineProvider } from "@mantine/core";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
