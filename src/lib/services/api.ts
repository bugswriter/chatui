// src/lib/services/api.ts
import { get } from "svelte/store";
import { authToken } from "$lib/stores/tokenStore";

export const API_CONFIG = {
  // The FastAPI/Jinja app is the primary entry point
  bizAPIURL: "https://api.bugswriter.ai",
  // The FastAPI API for chat services
  sysAPIURL: "https://sys.bugswriter.ai",
};

/**
 * Gets the current auth token from the in-memory store.
 * This is the single source of truth for the token on the client-side.
 * @returns The JWT string or null if not authenticated.
 */
export const getAuthToken = (): string | null => {
  return get(authToken);
};
