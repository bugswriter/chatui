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
  active_plan_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  avatar?: string | null;
  verified: boolean;
}

// --- Service Functions ---

// ✅ FIX: The incorrect fetchTokenFromSession function has been REMOVED.
// The logic to retrieve the token is now correctly handled by the authStore
// reading from the persistent tokenStore.

export const getUserDetails = async (): Promise<UserDetails> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token available.");
  }

  const response = await fetch(`${API_CONFIG.authBaseUrl}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If the token is invalid (e.g., expired), clear it from storage.
    authToken.set(null);
    throw new Error(
      "Failed to fetch user details. Your session may be invalid.",
    );
  }

  return response.json();
};
