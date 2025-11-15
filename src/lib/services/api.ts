// src/lib/services/api.ts
import { get } from "svelte/store";
import { authToken } from "$lib/stores/tokenStore";

// import { BIZAPIURL SYSAPIURL } from '$env/static/public';
import { env } from '$env/dynamic/public';

export const API_CONFIG = {
  // The FastAPI/Jinja app is the primary entry point for business logic,
  // including authentication, payments, and user management.
  bizAPIURL: env.PUBLIC_BIZAPIURL,
  // The FastAPI API for core chat services.
  sysAPIURL: env.PUBLIC_SYSAPIURL
};

/**
 * Gets the current auth token from the in-memory store.
 * This is the single source of truth for the token on the client-side.
 * @returns The JWT string or null if not authenticated.
 */
export const getAuthToken = (): string | null => {
  return get(authToken);
};
