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
    isLoading: true, // ✅ Start in a loading state to prevent UI flicker on page load
    error: null,
  });

  /**
   * The single, authoritative function to determine auth state.
   * It's called on initial app load and after a login attempt.
   */
  async function initialize() {
    update((s) => ({ ...s, isLoading: true }));
    const token = get(authToken);

    if (token) {
      try {
        // Attempt to validate the token by fetching user details.
        const user = await getUserDetails();
        set({ isAuthenticated: true, user, isLoading: false, error: null });
        // Once authenticated, load user-specific data.
        historyStore.loadSessions();
      } catch (error) {
        // ✅ THIS IS THE CRUCIAL FIX FOR STALE TOKENS.
        // If getUserDetails fails, it means the token is invalid/expired.
        // The service itself (getUserDetails) has already cleared the token from localStorage.
        // We now formally update our app's state to be fully logged out.
        console.warn(
          "Initialization failed due to invalid token. Logging out.",
        );
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null, // Don't show an error, just log them out.
        });
        chatStore.reset();
        historyStore.reset();
        // Invalidate tells SvelteKit to re-run all `load` functions that depend on this state.
        // This ensures the entire app acknowledges the logout.
        await invalidate("app:auth");
      }
    } else {
      // No token found, so the user is definitely logged out.
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  }

  /**
   * Logs the user out, clears all related state, and notifies the app.
   */
  function logout() {
    authToken.set(null); // This clears the token from localStorage.
    chatStore.reset();
    historyStore.reset();
    set({ isAuthenticated: false, user: null, isLoading: false, error: null });
    // Invalidate to ensure all parts of the app recognize the logged-out state.
    invalidate("app:auth");
  }

  /**
   * Handles the login process. It now correctly awaits the `initialize`
   * call, which updates the store, BEFORE the function returns. This
   * ensures the app state is fully updated when the login promise resolves.
   */
  async function login(email: string, password: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(
      `${API_CONFIG.bizAPIURL}/api/v1/auth/token`, // ✅ CORRECTED: Use bizAPIURL for auth
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

    // ✅ ROBUSTNESS FIX: After setting the token, we re-run the authoritative
    // `initialize` function. This will fetch the user and update the entire
    // app's state. The UI will react instantly to this store change.
    await initialize();
  }

  // No changes needed for register, refreshUserDetails, or updateAvatar
  async function register(
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    const response = await fetch(
      `${API_CONFIG.bizAPIURL}/api/v1/auth/register`, // ✅ CORRECTED: Use bizAPIURL for auth
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
      `${API_CONFIG.bizAPIURL}/api/v1/users/me/avatar`, // ✅ CORRECTED: Use bizAPIURL
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
