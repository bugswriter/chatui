// src/routes/+layout.ts
import { browser } from "$app/environment";
import { authStore } from "$lib/stores/authStore";
import { agentStore } from "$lib/stores/agentStore";
import { get } from "svelte/store";
import type { LayoutLoad } from "./$types";

// The `load` function is the gatekeeper for data for this layout.
// SvelteKit will wait for it to finish before rendering the page.
export const load: LayoutLoad = async ({ depends }) => {
  // depends() tells SvelteKit that this function should re-run
  // whenever we call invalidate('app:auth'), for example on logout.
  depends("app:auth");

  // Store initialization logic MUST only run in the browser because it
  // may depend on browser APIs like localStorage or fetch.
  if (browser) {
    // We run initializations in parallel for speed.
    // The await ensures that by the time we `get(authStore)`,
    // the store has already tried to validate the token.
    await Promise.all([authStore.initialize(), agentStore.initialize()]);
  }

  // After initialization, we can safely get the current state of the store.
  // During SSR (on the server), this will just be the default/logged-out state.
  // In the browser, this will be the correct, initialized state.
  const { isAuthenticated, user } = get(authStore);

  // We return this data, which will be available in `+layout.svelte`
  // via the `data` prop.
  return {
    isAuthenticated,
    user,
  };
};
