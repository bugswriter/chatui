// src/routes/+layout.ts
import { browser } from "$app/environment";
import { authStore } from "$lib/stores/authStore";
import { get } from "svelte/store";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ depends }) => {
  // depends() tells SvelteKit that this load function should be re-run
  // whenever we call invalidate('app:auth'). This creates a dependency.
  depends("app:auth");

  // This function now runs on both the server and the client.
  // We only want to initialize the store and fetch user data in the browser.
  if (browser) {
    // Initialize the authStore. This reads the token from localStorage
    // and fetches user details if a token exists. This is an async operation.
    await authStore.initialize();
  }

  // After initialization, we can get the current state of the store.
  // We return this state to the +layout.svelte component as the `data` prop.
  // Now, the layout will have the user info *before* it mounts.
  const { isAuthenticated, user } = get(authStore);

  return {
    isAuthenticated,
    user,
  };
};
