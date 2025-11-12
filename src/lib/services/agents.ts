// src/lib/services/agents.ts

import { API_CONFIG } from "$lib/services/api";
import type { Agent } from "$lib/types";

/**
 * Fetches the complete list of available agents from the backend.
 * This is a public endpoint and does not require authentication.
 * @param fetchFn The SvelteKit fetch function, passed from the load function.
 * @returns A promise that resolves to an array of Agent objects.
 */
// ✅ THE FIX: Accept `fetchFn` as a parameter.
export const getAgentsList = async (
  fetchFn: typeof fetch = fetch,
): Promise<Agent[]> => {
  // Use the provided fetch function
  const response = await fetchFn(
    `${API_CONFIG.sysAPIURL}/api/v1/admin/agents/`,
    {
      method: "GET",
      headers: {
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
