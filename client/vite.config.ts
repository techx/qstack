import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    envDir: "..",
    envPrefix: "QSTACK",
    server: {
      port: 6001,
      host: true,
      proxy: {
        "/api": {
          target: env.BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
