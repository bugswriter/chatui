// src/lib/stores/tokenStore.ts
import { writable } from "svelte/store";
import { browser } from "$app/environment";

// The key we'll use to store the token in localStorage.
const TOKEN_STORAGE_KEY = "auth_token";

// Load the initial value from localStorage if we are in the browser.
// If not in the browser (SSR) or if no token is found, default to null.
const initialToken = browser
  ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
  : null;

/**
 * A custom writable store that holds the JWT.
 * It automatically syncs its value with localStorage, making login persistent.
 * This avoids using localStorage directly in components and prevents SSR errors.
 */
const createTokenStore = () => {
  const { subscribe, set } = writable<string | null>(initialToken);

  return {
    subscribe,
    set: (token: string | null) => {
      if (browser) {
        // If a token is provided, store it. If null, remove it.
        if (token) {
          window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
      set(token);
    },
  };
};

export const authToken = createTokenStore();
