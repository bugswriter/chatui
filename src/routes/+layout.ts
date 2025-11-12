// src/routes/+layout.ts
import { browser } from "$app/environment";
import { authStore } from "$lib/stores/authStore";
import { agentStore } from "$lib/stores/agentStore";
import { get } from "svelte/store";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ depends, fetch }) => {
  depends("app:auth");

  if (browser) {
    // ✅ FIX: Pass the enhanced `fetch` from `load` into the store initializers.
    await Promise.all([
      authStore.initialize(fetch),
      agentStore.initialize(fetch),
    ]);
  }

  const { isAuthenticated, user } = get(authStore);

  return {
    isAuthenticated,
    user,
  };
};
