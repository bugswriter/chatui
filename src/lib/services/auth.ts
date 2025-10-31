// src/lib/services/auth.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";
import { authToken } from "$lib/stores/tokenStore";

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

export const fetchTokenFromSession = async (): Promise<string | null> => {
  // ✅ CORRECTED PATH: Added the '/auth' prefix to match the FastAPI router.
  const response = await fetch(
    `${API_CONFIG.authBaseUrl}/api/v1/auth/session/token`,
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const token = data.access_token;

  authToken.set(token);

  return token;
};

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
    authToken.set(null);
    throw new Error(
      "Failed to fetch user details. Your session may be invalid.",
    );
  }

  return response.json();
};
