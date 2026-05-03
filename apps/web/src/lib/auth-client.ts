import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;

export const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [usernameClient()],
});
