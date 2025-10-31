// src/lib/stores/authStore.ts

import { writable, get } from "svelte/store"; // ✅ CORRECTED: Added 'get'
import { authToken } from "$lib/stores/tokenStore";
import {
  fetchTokenFromSession,
  getUserDetails,
  type UserDetails,
} from "$lib/services/auth";
import { chatStore } from "./chatStore";
import { agentStore } from "./agentStore";
import { historyStore } from "./historyStore";

type AuthState = {
  isAuthenticated: boolean;
  user: UserDetails | null;
  isLoading: boolean;
  error: string | null;
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  async function initialize() {
    update((s) => ({ ...s, isLoading: true }));
    const token = await fetchTokenFromSession();
    if (token) {
      try {
        const user = await getUserDetails();
        set({ isAuthenticated: true, user, isLoading: false, error: null });
        agentStore.initialize();
        historyStore.loadSessions();
      } catch (error) {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } else {
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  }

  function clearSession() {
    authToken.set(null);
    chatStore.reset();
    historyStore.reset();
    set({ isAuthenticated: false, user: null, isLoading: false, error: null });
  }

  async function refreshUserDetails() {
    // ✅ FIX: The 'get' function is now correctly imported and will work here.
    if (!get(authToken)) return;

    try {
      const user = await getUserDetails();
      update((state) => ({ ...state, user }));
    } catch (error) {
      console.error("Failed to refresh user details, clearing session:", error);
      clearSession();
    }
  }

  return {
    subscribe,
    initialize,
    clearSession,
    refreshUserDetails,
  };
}

export const authStore = createAuthStore();
