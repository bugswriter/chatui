// src/lib/services/sessions.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";
import type { SessionState } from "$lib/types"; // We will add SessionState to types.ts next

/**
 * Explicitly creates a new chat session on the backend.
 * @returns A promise that resolves to the new session's state, including its ID.
 */
export const createNewSession = async (): Promise<SessionState> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token not found. Please log in.");
  }

  const response = await fetch(`${API_CONFIG.sysAPIURL}/api/v1/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to create new session:", errorText);
    throw new Error("Could not start a new chat session.");
  }

  return response.json();
};
