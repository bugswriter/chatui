// src/lib/services/agents.ts

import { API_CONFIG } from "$lib/services/api";
import type { Agent } from "$lib/types";

/**
 * Fetches the complete list of available agents from the backend.
 * This is a public endpoint and does not require authentication.
 * @returns A promise that resolves to an array of Agent objects.
 */
export const getAgentsList = async (): Promise<Agent[]> => {
  // ✅ REMOVED: The token check. No longer needed.
  // const token = getAuthToken();
  // if (!token) {
  //   throw new Error("Authentication token not found.");
  // }

  const response = await fetch(`${API_CONFIG.sysAPIURL}/api/v1/admin/agents/`, {
    method: "GET",
    headers: {
      // ✅ REMOVED: The Authorization header.
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch agents list:", await response.text());
    throw new Error("Could not retrieve the list of agents.");
  }

  const agents: Agent[] = await response.json();
  return agents;
};
