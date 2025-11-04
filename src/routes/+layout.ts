// src/routes/+layout.ts
import { browser } from "$app/environment";
import { authStore } from "$lib/stores/authStore";
import { agentStore } from "$lib/stores/agentStore"; // ✅ IMPORT agentStore
import { get } from "svelte/store";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ depends }) => {
  // depends() tells SvelteKit that this load function should be re-run
  // whenever we call invalidate('app:auth').
  depends("app:auth");

  // This function runs on both server and client. We only want to
  // initialize client-side stores in the browser.
  if (browser) {
    // ✅ Initialize both stores when the app loads.
    // We use Promise.all to run them in parallel for efficiency,
    // as they do not depend on each other.
    await Promise.all([authStore.initialize(), agentStore.initialize()]);
  }

  // After initialization, we can get the current state of the auth store
  // and pass it to the layout component.
  const { isAuthenticated, user } = get(authStore);

  return {
    isAuthenticated,
    user,
  };
};
