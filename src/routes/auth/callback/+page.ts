// src/routes/auth/callback/+page.ts
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
  // This function is now server-safe. It simply reads the URL parameters.
  const token = url.searchParams.get("token");
  const error = url.searchParams.get("error");

  // We pass the token and any potential error to the Svelte component as 'data'.
  return {
    token,
    error,
  };
};
