import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, "..", "");

  return {
    plugins: [react(), svgr()],
    envDir: "..",
    envPrefix: "qstack",
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
