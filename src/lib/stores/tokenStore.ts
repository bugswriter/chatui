// src/lib/stores/tokenStore.ts
import { writable } from "svelte/store";

/**
 * A simple writable store that holds the JWT in memory.
 * It is populated by the authStore and read by API services.
 * This avoids using localStorage and prevents circular dependencies.
 */
export const authToken = writable<string | null>(null);
