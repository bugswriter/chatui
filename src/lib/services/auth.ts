// src/lib/services/auth.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";
import { authToken } from "$lib/stores/tokenStore"; // Import the store

// --- Type Definitions ---

export interface UserDetails {
  email: string;
  name: string;
  id: string;
  coins: number;
  subscription_status: string;
  avatar?: string | null;
}

// --- Service Functions ---

/**
 * Fetches the JWT from the main FastAPI server's session bridge endpoint.
 * This is how the Svelte app acquires the token after a web-based login.
 * @returns The token if the session is valid.
 */
export const fetchTokenFromSession = async (): Promise<string | null> => {
  // This fetch call automatically includes the HttpOnly session cookie
  const response = await fetch(
    `${API_CONFIG.authBaseUrl}/api/v1/session/token`,
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const token = data.access_token;

  // Set the token in our in-memory store for other services to use
  authToken.set(token);

  return token;
};

/**
 * Fetches the current user's details from the chat API (sys.bugswriter.ai)
 * using the provided bearer token.
 * @returns User details if the token is valid.
 */
export const getUserDetails = async (): Promise<UserDetails> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token available.");
  }

  const response = await fetch(`${API_CONFIG.apiBaseUrl}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If this fails, the token is likely invalid. Clear it from the store.
    authToken.set(null);
    throw new Error(
      "Failed to fetch user details. Your session may be invalid.",
    );
  }

  return response.json();
};
