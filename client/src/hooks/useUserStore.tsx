import { create } from "zustand";
import * as auth from "../api/auth";

interface userState {
  name: string;
  email: string;
  role: string;
  getUser: () => Promise<any>;
}

export const useUserStore = create<userState>((set) => ({
  name: "",
  email: "",
  role: "",
  getUser: async () => set(await auth.whoami()),
}));
