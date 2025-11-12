// src/lib/stores/agentStore.ts

import { writable } from "svelte/store";
import type { Agent } from "$lib/types";
import { getAgentsList } from "$lib/services/agents";

type AgentStore = {
  agents: Agent[];
  agentsByName: Map<string, Agent>; // ✅ NEW: For fast lookups
  isInitialized: boolean;
  error: string | null;
};

function createAgentStore() {
  const { subscribe, set, update } = writable<AgentStore>({
    agents: [],
    agentsByName: new Map(), // ✅ NEW
    isInitialized: false,
    error: null,
  });

  async function initialize(fetchFn: typeof fetch = fetch) {
    // ✅ PREVENT re-fetching if already initialized
    let storeState: AgentStore | undefined;
    subscribe((s) => (storeState = s))();
    if (storeState?.isInitialized) return;

    try {
      const agentsList = await getAgentsList(fetchFn);
      agentsList.sort((a, b) => a.name.localeCompare(b.name));

      // ✅ NEW: Create a map for O(1) lookups by name (case-insensitive)
      const agentMap = new Map<string, Agent>();
      agentsList.forEach((agent) =>
        agentMap.set(agent.name.toLowerCase(), agent),
      );

      set({
        agents: agentsList,
        agentsByName: agentMap,
        isInitialized: true,
        error: null,
      });
    } catch (e) {
      console.error("Failed to initialize agent store:", e);
      update((s) => ({
        ...s,
        error: e instanceof Error ? e.message : "Could not load agents.",
      }));
    }
  }

  function search(query: string): Agent[] {
    if (!query) return []; // Return empty if query is empty
    const lowerCaseQuery = query.toLowerCase();
    let agents: Agent[] = [];
    subscribe((s) => (agents = s.agents))();
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(lowerCaseQuery),
    );
  }

  // ✅ NEW: Efficiently find a single agent by its exact name
  function findByName(name: string): Agent | undefined {
    let agentMap: Map<string, Agent> | undefined;
    subscribe((s) => (agentMap = s.agentsByName))();
    return agentMap?.get(name.toLowerCase());
  }

  return {
    subscribe,
    initialize,
    search,
    findByName, // ✅ NEW
  };
}

export const agentStore = createAgentStore();
