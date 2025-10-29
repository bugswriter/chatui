// src/lib/stores/historyStore.ts

import { writable } from "svelte/store";
import {
  getSessionsList,
  getSessionDetails,
  type SessionPreview,
  type SessionDetails,
} from "$lib/services/history";
import { chatStore } from "./chatStore";
import { agentStore } from "./agentStore";
import type { Message, Agent } from "$lib/types";

type HistoryState = {
  sessions: SessionPreview[];
  selectedSessionId: string | null;
  isLoading: boolean;
  error: string | null;
};

function createHistoryStore() {
  const { subscribe, set, update } = writable<HistoryState>({
    sessions: [],
    selectedSessionId: null,
    isLoading: false,
    error: null,
  });

  /**
   * Loads the initial list of all sessions from the API.
   */
  async function loadSessions() {
    update((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const sessions = await getSessionsList();
      // ✅ REMOVED the .slice(0, 5) limit.
      set({ sessions, selectedSessionId: null, isLoading: false, error: null });
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load history.";
      update((s) => ({ ...s, isLoading: false, error: errorMsg }));
    }
  }

  /**
   * Selects a session, fetches its details, and loads it into the chat store.
   */
  async function selectSession(sessionId: string) {
    let currentId;
    subscribe((s) => (currentId = s.selectedSessionId))();
    if (currentId === sessionId) return;

    chatStore.setLoadingState();
    update((s) => ({ ...s, selectedSessionId: sessionId, error: null }));

    try {
      const sessionDetails = await getSessionDetails(sessionId);

      const transformedMessages: Message[] = sessionDetails.messages.map(
        (apiMsg, index) => {
          const agent = apiMsg.agent_name
            ? agentStore.findByName(apiMsg.agent_name)
            : null;
          return {
            id: `hist_${sessionId}_${index}`,
            role: apiMsg.role,
            content: apiMsg.content,
            attachments: apiMsg.attachments || [],
            timestamp: new Date(),
            agent: agent || null,
          };
        },
      );

      const lastAgent = transformedMessages
        .slice()
        .reverse()
        .find((m) => m.role === "assistant")?.agent;

      const payload = {
        messages: transformedMessages,
        sessionId: sessionDetails.session_id,
        activeAgent: lastAgent || null,
      };

      chatStore.loadFromHistory(payload);
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load session.";
      console.error(errorMsg);
      chatStore.reset();
      update((s) => ({ ...s, selectedSessionId: null, error: errorMsg }));
    }
  }

  /**
   * Resets the chat store and UI to a new, empty chat session.
   */
  function createNewSession() {
    chatStore.reset();
    update((s) => ({ ...s, selectedSessionId: null }));
  }

  /**
   * Refreshes the session list from the API.
   */
  async function refreshSessionList() {
    try {
      const sessions = await getSessionsList();
      // ✅ REMOVED the .slice(0, 5) limit.
      update((s) => ({ ...s, sessions }));
    } catch (e) {
      console.error("Failed to refresh session list:", e);
    }
  }

  /**
   * Clears all history data from the store, used on logout.
   */
  function reset() {
    set({
      sessions: [],
      selectedSessionId: null,
      isLoading: false,
      error: null,
    });
  }

  return {
    subscribe,
    loadSessions,
    selectSession,
    createNewSession,
    refreshSessionList,
    reset,
  };
}

export const historyStore = createHistoryStore();
