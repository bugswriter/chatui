// src/lib/stores/authStore.ts

import { writable, get } from "svelte/store";
import { authToken } from "$lib/stores/tokenStore";
import { getUserDetails, type UserDetails } from "$lib/services/auth";
import { API_CONFIG } from "$lib/services/api";
import { chatStore } from "./chatStore";
import { historyStore } from "./historyStore";
import { invalidate } from "$app/navigation";

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
    const token = get(authToken);

    if (token) {
      try {
        const user = await getUserDetails();
        set({ isAuthenticated: true, user, isLoading: false, error: null });
        historyStore.loadSessions();
      } catch (error) {
        // ✅ THIS IS THE CRUCIAL FIX
        // If getting user details fails (e.g., stale token),
        // set the state to logged out AND force the entire app to
        // acknowledge this change by invalidating its data.
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
        await invalidate("app:auth");
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

  function logout() {
    authToken.set(null);
    chatStore.reset();
    historyStore.reset();
    set({ isAuthenticated: false, user: null, isLoading: false, error: null });
    invalidate("app:auth");
  }

  async function login(email: string, password: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(
      `${API_CONFIG.authBaseUrl}/api/v1/auth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || "Incorrect email or password.");
    }

    const data = await response.json();
    authToken.set(data.access_token);
    // After setting the token, initialize will fetch the user.
    await initialize();
    // After initialization is complete, invalidate to ensure UI consistency.
    await invalidate("app:auth");
  }

  async function register(
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    const response = await fetch(
      `${API_CONFIG.authBaseUrl}/api/v1/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      },
    );
    if (response.status !== 201) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail ||
          "Registration failed. Email may already be in use.",
      );
    }
    return "Success! Please check your email to verify your account.";
  }

  async function refreshUserDetails() {
    if (!get(authToken)) return;
    try {
      const user = await getUserDetails();
      update((state) => ({ ...state, user }));
    } catch (error) {
      console.error("Failed to refresh user details, logging out:", error);
      logout();
    }
  }

  async function updateAvatar(file: File) {
    const token = get(authToken);
    if (!token) throw new Error("You must be logged in to upload an avatar.");
    const formData = new FormData();
    formData.append("avatar_file", file);
    const response = await fetch(
      `${API_CONFIG.authBaseUrl}/api/v1/users/me/avatar`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload avatar.");
    }
    const updatedUser = await response.json();
    update((state) => ({ ...state, user: updatedUser }));
  }

  return {
    subscribe,
    initialize,
    logout,
    login,
    register,
    refreshUserDetails,
    updateAvatar,
  };
}

export const authStore = createAuthStore();
