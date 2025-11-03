// src/lib/services/agents.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";
import type { Agent } from "$lib/types";

/**
 * Fetches the complete list of available agents from the backend.
 * This is typically called once when the application loads.
 * @returns A promise that resolves to an array of Agent objects.
 */
export const getAgentsList = async (): Promise<Agent[]> => {
  const token = getAuthToken();
  if (!token) {
    // This function is called on app load, so throwing an error
    // is acceptable as it indicates a non-authenticated state.
    throw new Error("Authentication token not found.");
  }

  const response = await fetch(
    `${API_CONFIG.apiBaseUrl}/api/v1/admin/agents/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error("Failed to fetch agents list:", await response.text());
    throw new Error("Could not retrieve the list of agents.");
  }

  const agents: Agent[] = await response.json();
  return agents;
};
