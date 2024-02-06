import { create } from "zustand";
import * as auth from "../api/auth";

interface userState {
  name: string;
  email: string;
  role: string;
  loggedIn: boolean | undefined;
  location: string;
  zoomlink: string;
  discord: string;
  getUser: () => Promise<any>;
}

export const useUserStore = create<userState>((set) => ({
  name: "",
  email: "",
  role: "",
  location: "",
  zoomlink: "",
  discord: "",
  loggedIn: undefined,
  getUser: async () => set(await auth.whoami()),
}));
